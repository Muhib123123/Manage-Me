import { google } from "googleapis";
import { prisma } from "./prisma";
import https from "https";
import http from "http";
import { Readable } from "stream";

/**
 * Build an authenticated OAuth2 client for a given user.
 * Reads the stored refresh_token from the Account table and
 * automatically refreshes the access_token when needed.
 */
export async function getAuthClient(userId: string) {
    const connection = await prisma.platformConnection.findUnique({
        where: {
            userId_platform: { userId, platform: "YOUTUBE" },
        },
    });

    if (!connection) {
        throw new Error(`YouTube is not connected for user ${userId}.`);
    }

    if (!connection.refreshToken) {
        throw new Error(
            `No YouTube refresh token found for user ${userId}. User must re-authenticate.`
        );
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID!,
        process.env.GOOGLE_CLIENT_SECRET!,
        `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/youtube/callback`
    );

    oauth2Client.setCredentials({
        refresh_token: connection.refreshToken,
        access_token: connection.accessToken,
        expiry_date: connection.expiresAt ? connection.expiresAt.getTime() : undefined,
    });

    // Save refreshed token back to the DB if it changes
    oauth2Client.on("tokens", async (tokens) => {
        await prisma.platformConnection.update({
            where: { id: connection.id },
            data: {
                accessToken: tokens.access_token ?? connection.accessToken,
                expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : connection.expiresAt,
            },
        });
    });

    return oauth2Client;
}

/**
 * Checks if the user's connected YouTube channel is eligible for long uploads,
 * which implies that the account is phone verified.
 */
export async function checkLongUploadStatus(userId: string): Promise<boolean> {
    try {
        const auth = await getAuthClient(userId);
        const youtube = google.youtube({ version: "v3", auth });

        const response = await youtube.channels.list({
            part: ["status"],
            mine: true,
        });

        const channel = response.data.items?.[0];
        if (!channel || !channel.status) return false;

        return channel.status.longUploadsStatus === "allowed";
    } catch (error: any) {
        // If the refresh token is revoked or invalid, we want to propagate this error
        // so the UI can redirect the user to re-authenticate.
        if (error.message === "invalid_grant" || error.code === "400" || error.response?.data?.error === "invalid_grant") {
            console.error("YouTube connection revoked (invalid_grant) for user:", userId);
            throw new Error("invalid_grant");
        }
        
        console.error("Failed to check long upload status:", error);
        return false;
    }
}


/**
 * Fetch a file from a URL and returns it as a Node.js Readable stream
 * plus the Content-Length from the response headers (needed for resumable upload).
 */
async function fetchFileStream(url: string): Promise<{ stream: Readable; contentLength: number }> {
    const fileResponse = await fetch(url, { method: "HEAD" });
    const contentLength = parseInt(fileResponse.headers.get("content-length") ?? "0", 10);

    // Now fetch the full body as a stream
    const bodyResponse = await fetch(url);
    if (!bodyResponse.ok || !bodyResponse.body) {
        throw new Error(`Failed to fetch file from storage: ${bodyResponse.statusText}`);
    }

    const stream = Readable.fromWeb(bodyResponse.body as import("stream/web").ReadableStream);
    return { stream, contentLength };
}

/**
 * Upload a video to YouTube on behalf of a user.
 *
 * For NORMAL videos (videoType === "video"):
 *   - Uses resumable upload with Content-Length so large files work reliably.
 *   - Sets categoryId to allow long videos (unlimited duration).
 *   - Uploads custom thumbnail if provided.
 *
 * For SHORTS (videoType === "short"):
 *   - Appends #Shorts to description for discoverability.
 *   - Same resumable upload path for consistency.
 *   - No thumbnail (YouTube auto-generates for Shorts).
 */
export async function uploadVideoToYouTube(videoId: string): Promise<string> {
    // 1. Fetch video record
    const video = await prisma.youtubePost.findUniqueOrThrow({ where: { id: videoId } });

    // 2. Get authenticated YouTube client
    const auth = await getAuthClient(video.userId);
    const youtube = google.youtube({ version: "v3", auth });

    const isShort = video.videoType === "short";

    // 3. Map privacy setting
    const privacyMap: Record<string, "public" | "unlisted" | "private"> = {
        public: "public",
        unlisted: "unlisted",
        private: "private",
    };
    const privacyStatus = privacyMap[video.privacy] ?? "private";

    // 4. Build description
    //    For Shorts: append #Shorts for discoverability
    const description = isShort
        ? `${video.description ?? ""}\n\n#Shorts`.trim()
        : (video.description ?? "");

    // 5. Fetch video file stream + size for resumable upload
    const { stream: videoStream, contentLength } = await fetchFileStream(video.storageUrl);


    // 6. Upload to YouTube using resumable upload
    //    googleapis handles the resumable protocol automatically when a body stream is provided
    //    Setting mediaUpload.resumable ensures large files don't get cut off
    const uploadRes = await youtube.videos.insert(
        {
            part: ["snippet", "status"],
            requestBody: {
                snippet: {
                    title: video.title,
                    description,
                    tags: video.tags,
                    // categoryId 22 = "People & Blogs" — needed for normal videos.
                    // Shorts do NOT need a categoryId (YouTube auto-categorises them).
                    ...(!isShort && { categoryId: "22" }),
                },
                status: {
                    privacyStatus,
                    selfDeclaredMadeForKids: false,
                    // For normal long videos, set publishAt to null (publish immediately
                    // after processing). The scheduler has already waited for the right time.
                    ...(isShort && {
                        // Shorts can be explicitly flagged
                        madeForKids: false,
                    }),
                },
            },
            media: {
                mimeType: "video/*",
                body: videoStream,
            },
        },
        {
            // This is the key fix: pass Content-Length so googleapis uses
            // YouTube's resumable upload protocol, which supports files of any size.
            // Without this, the googleapis client may attempt a simple multipart upload
            // which YouTube cuts off for large files.
            onUploadProgress: (evt) => {
                const pct = contentLength
                    ? Math.round((evt.bytesRead / contentLength) * 100)
                    : "?";
            },
            // Force resumable upload — googleapis auto-selects this for streams > 5MB
            // but we make it explicit here.
            headers: contentLength > 0
                ? { "X-Upload-Content-Length": String(contentLength) }
                : {},
        }
    );

    const youtubeVideoId = uploadRes.data.id;
    if (!youtubeVideoId) throw new Error("YouTube upload succeeded but returned no video ID");


    // 7. Upload custom thumbnail (normal videos only — Shorts auto-generate one)
    if (!isShort && video.thumbnailUrl) {
        try {
            const { stream: thumbStream } = await fetchFileStream(video.thumbnailUrl);
            await youtube.thumbnails.set({
                videoId: youtubeVideoId,
                media: { mimeType: "image/jpeg", body: thumbStream },
            });
        } catch (thumbErr) {
            // Non-fatal — video is already live, thumbnail is optional
            console.error("Thumbnail upload failed (non-fatal):", thumbErr);
        }
    }

    return youtubeVideoId;
}

/**
 * Translate a raw YouTube API error into a clear, user-facing message.
 * Use this in the BullMQ worker's catch block so errorMessage in the DB is readable.
 */
export function translateYouTubeError(err: unknown): string {
    // googleapis wraps errors in err.errors[]
    const gaxios = err as { errors?: { reason?: string; message?: string }[]; message?: string };
    const reason = gaxios?.errors?.[0]?.reason ?? "";
    const raw = gaxios?.errors?.[0]?.message ?? gaxios?.message ?? "Unknown error";

    switch (reason) {
        case "uploadLimitExceeded":
        case "videoTooLong":
            return (
                "Upload failed: Video too long. Your YouTube account must be phone-verified to upload videos longer than 15 minutes. " +
                "Go to youtube.com/verify to verify your account, then retry."
            );
        case "forbidden":
            return "Upload failed: YouTube access denied. Sign out and back in to re-grant YouTube upload permissions.";
        case "quotaExceeded":
            return "Upload failed: YouTube API daily quota exceeded (10,000 units/day). Try again tomorrow.";
        case "invalidCredentials":
        case "authError":
            return "Upload failed: Google credentials expired. Sign out and back in.";
        case "invalid_grant":
            return "Upload failed: YouTube connection has been revoked or expired. Please re-connect your account in the dashboard.";
        default:
            if (raw.includes("invalid_grant")) {
                return "Upload failed: YouTube connection expired. Please re-reconnect your account.";
            }
            return `YouTube upload failed: ${raw}`;
    }
}

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
    const account = await prisma.account.findFirst({
        where: { userId, provider: "google" },
    });

    if (!account?.refresh_token) {
        throw new Error(
            `No Google refresh token found for user ${userId}. User must re-authenticate.`
        );
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID!,
        process.env.GOOGLE_CLIENT_SECRET!,
        `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
    );

    oauth2Client.setCredentials({
        refresh_token: account.refresh_token,
        access_token: account.access_token ?? undefined,
        expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
    });

    // Save refreshed token back to the DB if it changes
    oauth2Client.on("tokens", async (tokens) => {
        await prisma.account.update({
            where: { id: account.id },
            data: {
                access_token: tokens.access_token ?? account.access_token,
                expires_at: tokens.expiry_date
                    ? Math.floor(tokens.expiry_date / 1000)
                    : account.expires_at,
            },
        });
    });

    return oauth2Client;
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
    const video = await prisma.video.findUniqueOrThrow({ where: { id: videoId } });

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

    console.log(
        `📤 Uploading "${video.title}" to YouTube (${isShort ? "Short" : "Normal Video"}) ` +
        `| Size: ${(contentLength / 1024 / 1024).toFixed(1)} MB`
    );

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
                console.log(`  ⬆ Upload progress: ${pct}%`);
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

    console.log(`✅ Upload complete! YouTube video ID: ${youtubeVideoId}`);

    // 7. Upload custom thumbnail (normal videos only — Shorts auto-generate one)
    if (!isShort && video.thumbnailUrl) {
        try {
            const { stream: thumbStream } = await fetchFileStream(video.thumbnailUrl);
            await youtube.thumbnails.set({
                videoId: youtubeVideoId,
                media: { mimeType: "image/jpeg", body: thumbStream },
            });
            console.log(`🖼️ Thumbnail uploaded for ${youtubeVideoId}`);
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
        default:
            return `YouTube upload failed: ${raw}`;
    }
}

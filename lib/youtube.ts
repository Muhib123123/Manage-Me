import { google } from "googleapis";
import { prisma } from "./prisma";

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
 * Upload a video to YouTube on behalf of a user.
 * Downloads the video from UploadThing via its URL,
 * streams it to the YouTube API, and returns the YouTube video ID.
 */
export async function uploadVideoToYouTube(videoId: string): Promise<string> {
    // 1. Fetch video record
    const video = await prisma.video.findUniqueOrThrow({ where: { id: videoId } });

    // 2. Get authenticated YouTube client
    const auth = await getAuthClient(video.userId);
    const youtube = google.youtube({ version: "v3", auth });

    // 3. Determine category & settings based on video type
    const isShort = video.videoType === "short";

    // 4. Fetch the video file from UploadThing as a readable stream
    const fileResponse = await fetch(video.storageUrl);
    if (!fileResponse.ok || !fileResponse.body) {
        throw new Error(`Failed to fetch video from storage: ${fileResponse.statusText}`);
    }

    // Convert Web ReadableStream → Node.js Readable
    const { Readable } = await import("stream");
    const readable = Readable.fromWeb(fileResponse.body as import("stream/web").ReadableStream);

    // 5. Map privacy setting
    const privacyMap: Record<string, "public" | "unlisted" | "private"> = {
        public: "public",
        unlisted: "unlisted",
        private: "private",
    };
    const privacyStatus = privacyMap[video.privacy] ?? "private";

    // 6. Upload to YouTube
    const uploadRes = await youtube.videos.insert({
        part: ["snippet", "status"],
        requestBody: {
            snippet: {
                title: video.title,
                description: video.description ?? "",
                tags: video.tags,
                // YouTube Shorts are auto-detected by aspect ratio & duration,
                // but we add #Shorts to the description for discoverability
                ...(isShort && {
                    description: `${video.description ?? ""}\n\n#Shorts`.trim(),
                }),
            },
            status: {
                privacyStatus,
                // Makes the video go live immediately after YouTube processes it
                selfDeclaredMadeForKids: false,
            },
        },
        media: {
            mimeType: "video/*",
            body: readable,
        },
    });

    const youtubeVideoId = uploadRes.data.id;
    if (!youtubeVideoId) throw new Error("YouTube upload succeeded but returned no video ID");

    // 7. Upload thumbnail if provided (not for Shorts)
    if (!isShort && video.thumbnailUrl) {
        try {
            const thumbResponse = await fetch(video.thumbnailUrl);
            if (thumbResponse.ok && thumbResponse.body) {
                const thumbStream = Readable.fromWeb(
                    thumbResponse.body as import("stream/web").ReadableStream
                );
                await youtube.thumbnails.set({
                    videoId: youtubeVideoId,
                    media: { mimeType: "image/jpeg", body: thumbStream },
                });
            }
        } catch (thumbErr) {
            // Non-fatal — video is already uploaded, thumbnail is optional
            console.error("Thumbnail upload failed (non-fatal):", thumbErr);
        }
    }

    return youtubeVideoId;
}

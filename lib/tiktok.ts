/**
 * lib/tiktok.ts
 * Handles TikTok token refresh and video publishing via the Content Posting API.
 */

import { prisma } from "./prisma";

const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY!;
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET!;

/* ─── Token Refresh ─────────────────────────────── */

/**
 * Ensures the user's TikTok access token is still valid.
 * If it's expiring within 5 minutes, refreshes it automatically.
 * Returns the valid access token.
 */
export async function getValidTikTokToken(userId: string): Promise<string> {
    const connection = await prisma.platformConnection.findUnique({
        where: { userId_platform: { userId, platform: "TIKTOK" } },
    });

    if (!connection) throw new Error("TikTok account not connected");
    if (!connection.refreshToken) throw new Error("No TikTok refresh token stored");

    // Check if token is still valid (with 5 min buffer)
    const fiveMinutes = 5 * 60 * 1000;
    const isExpired =
        !connection.expiresAt || connection.expiresAt.getTime() - Date.now() < fiveMinutes;

    if (!isExpired) {
        return connection.accessToken;
    }

    // Token is expired or expiring — refresh it
    console.log(`🔄 Refreshing TikTok token for user ${userId}...`);

    const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_key: TIKTOK_CLIENT_KEY,
            client_secret: TIKTOK_CLIENT_SECRET,
            grant_type: "refresh_token",
            refresh_token: connection.refreshToken,
        }).toString(),
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`TikTok token refresh failed: ${errText}`);
    }

    const data = await res.json();
    const { access_token, refresh_token, expires_in } = data;

    if (!access_token) throw new Error("TikTok refresh returned no access_token");

    const expiresAt = new Date(Date.now() + (expires_in ?? 86400) * 1000);

    // Persist updated tokens
    await prisma.platformConnection.update({
        where: { userId_platform: { userId, platform: "TIKTOK" } },
        data: {
            accessToken: access_token,
            ...(refresh_token && { refreshToken: refresh_token }),
            expiresAt,
        },
    });

    console.log(`✅ TikTok token refreshed for user ${userId}`);
    return access_token;
}

/* ─── Content Posting API ──────────────────────── */

/**
 * Posts a TikTok video by directly uploading the file.
 * Uses the "FILE_UPLOAD" source flow from the TikTok Content Posting API v2.
 *
 * It first downloads the video from the provided URL, initializes the upload
 * session with TikTok, puts the video binary data, and then returns the publish_id
 * to poll the rendering status.
 */
export async function initTikTokVideoPublish(
    accessToken: string,
    opts: {
        videoUrl: string;
        caption: string;
        privacyLevel: string;
        allowDuet: boolean;
        allowStitch: boolean;
        allowComment: boolean;
    }
): Promise<string> {

    // 1. Download video file from UploadThing URL
    const dlUrl = opts.videoUrl.includes("utfs.io") || opts.videoUrl.includes("uploadthing.com")
        ? `${opts.videoUrl}?download=1`
        : opts.videoUrl;

    const fileRes = await fetch(dlUrl);
    if (!fileRes.ok) {
        throw new Error(`Failed to download video from URL: ${fileRes.status} ${fileRes.statusText}`);
    }

    const videoBuffer = await fileRes.arrayBuffer();
    const videoSize = videoBuffer.byteLength;

    // TikTok generally recommends chunk sizes under 64MB for FILE_UPLOAD
    const MAX_CHUNK_SIZE = 64 * 1024 * 1024;
    if (videoSize > MAX_CHUNK_SIZE) {
        throw new Error(`Video file too large for direct API upload. Limit is 64MB, this file is ${(videoSize / 1024 / 1024).toFixed(2)}MB. Please compress and try again.`);
    }

    // Force strict Sandbox requirements: Sandbox apps CANNOT post publicly.
    // We override whatever the user selected to SELF_ONLY, as uploading old failed
    // posts from the dashboard will resubmit their old PUBLIC setting and fail.
    const strictPrivacy = "SELF_ONLY";

    // 2. Initialize the post with FILE_UPLOAD method
    const initBody = {
        post_info: {
            title: opts.caption || "",
            privacy_level: strictPrivacy,
            disable_duet: true,
            disable_stitch: true,
            disable_comment: true, // Also forcing comment disabled for ultimate safety
            brand_organic_toggle: false,
            brand_content_toggle: false,
            auto_add_music: false,
        },
        source_info: {
            source: "FILE_UPLOAD",
            video_size: videoSize,
            chunk_size: videoSize,
            total_chunk_count: 1,
        },
        post_mode: "DIRECT_POST",
        media_type: "VIDEO",
    };

    console.log("🚀 ~ TikTok Video Publish Init Payload ~");
    console.log(JSON.stringify(initBody, null, 2));

    const initRes = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json; charset=UTF-8",
        },
        body: JSON.stringify(initBody),
    });

    const initData = await initRes.json();

    if (!initRes.ok || initData.error?.code !== "ok") {
        throw new Error(
            `TikTok publish init failed: ${initData.error?.message || JSON.stringify(initData)}`
        );
    }

    const publishId = initData.data.publish_id as string;
    const uploadUrl = initData.data.upload_url as string;

    if (!uploadUrl) {
        throw new Error("No upload_url returned from TikTok initialization");
    }

    // 3. Upload the binary data to the provided uploadUrl using PUT
    const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
            "Content-Range": `bytes 0-${videoSize - 1}/${videoSize}`,
            "Content-Type": "video/mp4",
        },
        body: videoBuffer,
    });

    if (!putRes.ok) {
        const errorText = await putRes.text();
        throw new Error(`TikTok file PUT failed: ${putRes.status} ${errorText}`);
    }

    return publishId;
}

/**
 * Polls TikTok's publish status endpoint until the video is PUBLISH_COMPLETE or FAILED.
 * Returns the final share_id on success.
 */
export async function pollTikTokPublishStatus(
    accessToken: string,
    publishId: string,
    maxAttempts = 30,
    intervalMs = 10_000
): Promise<string> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await new Promise((r) => setTimeout(r, intervalMs));

        const res = await fetch("https://open.tiktokapis.com/v2/post/publish/status/fetch/", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json; charset=UTF-8",
            },
            body: JSON.stringify({ publish_id: publishId }),
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(`TikTok status poll failed: ${JSON.stringify(data)}`);
        }

        // The v2 status endpoint returns it as data.status
        const status = data?.data?.status;
        console.log(`🔍 TikTok publish status (attempt ${attempt}):`, status);

        if (status === "PUBLISH_COMPLETE") {
            const publicUrlId = data?.data?.publicaly_available_post_id?.[0];
            return publicUrlId && publicUrlId !== "" ? publicUrlId : publishId;
        }

        if (status === "FAILED") {
            const reason = data?.data?.fail_reason || "Unknown reason";
            throw new Error(`TikTok publish failed: ${reason}`);
        }
    }

    throw new Error(`TikTok publish timed out after ${maxAttempts} attempts`);
}

/* ─── Full publish flow ─────────────────────────── */

/**
 * Top-level function called by the BullMQ worker.
 * Refreshes the token, initiates the publish, polls until done, returns the share_id.
 */
export async function publishTikTokVideo(postId: string): Promise<string> {
    const post = await prisma.tiktokPost.findUnique({ where: { id: postId } });
    if (!post) throw new Error(`TiktokPost ${postId} not found`);

    const accessToken = await getValidTikTokToken(post.userId);

    const publishId = await initTikTokVideoPublish(accessToken, {
        videoUrl: post.videoUrl,
        caption: post.caption || "",
        privacyLevel: post.privacyLevel,
        allowDuet: post.allowDuet,
        allowStitch: post.allowStitch,
        allowComment: post.allowComment,
    });

    const shareId = await pollTikTokPublishStatus(accessToken, publishId);
    return shareId;
}

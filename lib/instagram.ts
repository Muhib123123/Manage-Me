import { prisma } from "./prisma";

// Helper to handle standard API responses/errors
async function fetchGraphApi(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`https://graph.facebook.com/v19.0/${endpoint}`, options);
    const data = await response.json();

    if (data.error) {
        throw new Error(data.error.message || "Unknown Instagram Graph API error");
    }

    return data;
}

/**
 * Uploads a photo to Instagram
 */
export async function uploadInstagramPhoto(
    userId: string,
    imageUrl: string,
    caption?: string
) {
    // 1. Get the user's Instagram connection and access token
    const connection = await prisma.platformConnection.findUnique({
        where: {
            userId_platform: {
                userId,
                platform: "INSTAGRAM",
            },
        },
    });

    if (!connection || !connection.accessToken || !connection.platformId) {
        throw new Error("Instagram is not connected or missing credentials.");
    }

    const { platformId: instagramAccountId, accessToken } = connection;

    try {
        // 2. Create the Item Container
        // POST /{ig-user-id}/media?image_url={image-url}&caption={caption}

        let containerUrl = `${instagramAccountId}/media?image_url=${encodeURIComponent(imageUrl)}&access_token=${accessToken}`;

        if (caption) {
            containerUrl += `&caption=${encodeURIComponent(caption)}`;
        }

        const containerResponse = await fetchGraphApi(containerUrl, { method: "POST" });
        const creationId = containerResponse.id;

        if (!creationId) {
            throw new Error("Failed to create media container");
        }

        // 3. Publish the Container
        // POST /{ig-user-id}/media_publish?creation_id={creation-id}
        const publishUrl = `${instagramAccountId}/media_publish?creation_id=${creationId}&access_token=${accessToken}`;
        const publishResponse = await fetchGraphApi(publishUrl, { method: "POST" });

        return { success: true, id: publishResponse.id };

    } catch (error: any) {
        console.error("Instagram Photo Upload Error:", error);
        throw new Error(`Failed to publish photo: ${error.message}`);
    }
}

/**
 * Uploads a Video or Reel to Instagram
 * Note: Videos often require waiting for the container to finish processing before publishing.
 * For this simplified flow, we assume short videos that process quickly, or we would need a polling mechanism.
 */
export async function uploadInstagramVideo(
    userId: string,
    videoUrl: string,
    caption?: string,
    isReel: boolean = false
) {
    const connection = await prisma.platformConnection.findUnique({
        where: {
            userId_platform: {
                userId,
                platform: "INSTAGRAM",
            },
        },
    });

    if (!connection || !connection.accessToken || !connection.platformId) {
        throw new Error("Instagram is not connected or missing credentials.");
    }

    const { platformId: instagramAccountId, accessToken } = connection;

    try {
        // 1. Create the Video Container
        let containerUrl = `${instagramAccountId}/media?video_url=${encodeURIComponent(videoUrl)}&media_type=${isReel ? "REELS" : "VIDEO"}&access_token=${accessToken}`;

        if (caption) {
            containerUrl += `&caption=${encodeURIComponent(caption)}`;
        }

        const containerResponse = await fetchGraphApi(containerUrl, { method: "POST" });
        const creationId = containerResponse.id;

        if (!creationId) {
            throw new Error("Failed to create video media container");
        }

        // 2. Poll the container status until it finishes processing
        let isReady = false;
        let attempts = 0;
        const maxAttempts = 30; // Max 5 minutes (10s * 30)

        while (!isReady && attempts < maxAttempts) {
            const statusUrl = `${creationId}?fields=status_code&access_token=${accessToken}`;
            const statusResponse = await fetchGraphApi(statusUrl);

            if (statusResponse.status_code === 'FINISHED') {
                isReady = true;
            } else if (statusResponse.status_code === 'ERROR') {
                throw new Error("Video processing failed on Instagram's servers.");
            } else {
                // Wait 10 seconds before polling again
                await new Promise(resolve => setTimeout(resolve, 10000));
                attempts++;
            }
        }

        if (!isReady) {
            throw new Error("Video processing timed out.");
        }

        // 3. Publish the Container
        const publishUrl = `${instagramAccountId}/media_publish?creation_id=${creationId}&access_token=${accessToken}`;
        const publishResponse = await fetchGraphApi(publishUrl, { method: "POST" });

        return { success: true, id: publishResponse.id };

    } catch (error: any) {
        console.error("Instagram Video Upload Error:", error);
        throw new Error(`Failed to publish video: ${error.message}`);
    }
}

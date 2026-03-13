import { prisma } from "./prisma";

// Helper to handle standard API responses/errors
async function fetchGraphApi(endpoint: string, options: RequestInit = {}) {
    // For the direct Instagram Login flow, we use the graph.instagram.com endpoint
    const baseUrl = "https://graph.instagram.com/v19.0";
    const response = await fetch(`${baseUrl}/${endpoint}`, options);
    const data = await response.json();

    if (data.error) {
        throw new Error(data.error.message || "Unknown Instagram Graph API error");
    }

    return data;
}

// After publishing, fetch the post permalink and extract the shortcode from the URL.
// Instagram web URLs look like: https://www.instagram.com/p/{shortcode}/
// We store the shortcode so the "View" button can construct the correct link.
async function fetchShortcode(mediaId: string, accessToken: string): Promise<string> {
    try {
        const data = await fetchGraphApi(`${mediaId}?fields=permalink&access_token=${accessToken}`);
        if (data.permalink) {
            // Extract shortcode from URL: .../p/{shortcode}/
            const match = data.permalink.match(/\/p\/([^/]+)/);
            if (match) return match[1];
        }
    } catch {
        // If fetching shortcode fails, fall back to the raw numeric ID
        console.warn(`Could not fetch permalink for media ${mediaId}`);
    }
    return mediaId; // fallback — View URL will be broken but at least it won't crash
}

/**
 * Uploads a photo to Instagram
 */
export async function uploadInstagramPhoto(
    userId: string,
    mediaUrls: string[],
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
        if (mediaUrls.length === 1) {
            // SINGLE PHOTO PIPELINE
            const imageUrl = mediaUrls[0];
            let containerUrl = `${instagramAccountId}/media?image_url=${encodeURIComponent(imageUrl)}&access_token=${accessToken}`;

            if (caption) {
                containerUrl += `&caption=${encodeURIComponent(caption)}`;
            }

            const containerResponse = await fetchGraphApi(containerUrl, { method: "POST" });
            const creationId = containerResponse.id;

            if (!creationId) {
                throw new Error("Failed to create media container");
            }

            const publishUrl = `${instagramAccountId}/media_publish?creation_id=${creationId}&access_token=${accessToken}`;
            const publishResponse = await fetchGraphApi(publishUrl, { method: "POST" });
            const shortcode = await fetchShortcode(publishResponse.id, accessToken);
            return { success: true, id: shortcode };

        } else {
            // CAROUSEL PIPELINE
            const itemContainerIds = [];

            // 1. Create individual containers for each image
            for (const url of mediaUrls) {
                const itemUrl = `${instagramAccountId}/media?image_url=${encodeURIComponent(url)}&is_carousel_item=true&access_token=${accessToken}`;
                const itemResponse = await fetchGraphApi(itemUrl, { method: "POST" });

                if (!itemResponse.id) throw new Error("Failed to create individual carousel item container");
                itemContainerIds.push(itemResponse.id);
            }

            // 2. Create the master Carousel container
            const childrenString = itemContainerIds.join(",");
            let carouselUrl = `${instagramAccountId}/media?media_type=CAROUSEL&children=${encodeURIComponent(childrenString)}&access_token=${accessToken}`;

            if (caption) {
                carouselUrl += `&caption=${encodeURIComponent(caption)}`;
            }

            const carouselResponse = await fetchGraphApi(carouselUrl, { method: "POST" });
            const carouselCreationId = carouselResponse.id;

            if (!carouselCreationId) {
                throw new Error("Failed to create master carousel container");
            }

            // 3. Publish the Carousel container
            const publishUrl = `${instagramAccountId}/media_publish?creation_id=${carouselCreationId}&access_token=${accessToken}`;
            const publishResponse = await fetchGraphApi(publishUrl, { method: "POST" });
            const shortcode = await fetchShortcode(publishResponse.id, accessToken);
            return { success: true, id: shortcode };
        }

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
    mediaUrls: string[],
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
        const videoUrl = mediaUrls[0];

        // ⚠️ Instagram deprecated media_type=VIDEO for standalone feed posts in Nov 2023.
        // ALL video uploads (both regular "Video" and Reels) must now use media_type=REELS.
        // Source: https://developers.facebook.com/docs/instagram-api/reference/ig-user/media
        let containerUrl = `${instagramAccountId}/media?video_url=${encodeURIComponent(videoUrl)}&media_type=REELS&access_token=${accessToken}`;

        if (caption) {
            containerUrl += `&caption=${encodeURIComponent(caption)}`;
        }

        const containerResponse = await fetchGraphApi(containerUrl, { method: "POST" });
        const creationId = containerResponse.id;

        if (!creationId) {
            throw new Error("Failed to create video media container — no ID returned from API");
        }

        // 2. Poll the container status until it finishes processing
        //    Instagram returns status_code: IN_PROGRESS | FINISHED | ERROR | EXPIRED | PUBLISHED
        let isReady = false;
        let attempts = 0;
        const maxAttempts = 36; // Max 6 minutes (10s * 36)

        while (!isReady && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            const statusUrl = `${creationId}?fields=status_code,status&access_token=${accessToken}`;
            const statusResponse = await fetchGraphApi(statusUrl);


            if (statusResponse.status_code === 'FINISHED') {
                isReady = true;
            } else if (statusResponse.status_code === 'ERROR' || statusResponse.status_code === 'EXPIRED') {
                throw new Error(`Video processing failed with status: ${statusResponse.status_code}. Check your video format (MP4, H.264 codec) and dimensions.`);
            }
            // else IN_PROGRESS → keep polling
            attempts++;
        }

        if (!isReady) {
            throw new Error("Video processing timed out after 6 minutes. Try a shorter or smaller video.");
        }

        // 3. Publish the Container
        const publishUrl = `${instagramAccountId}/media_publish?creation_id=${creationId}&access_token=${accessToken}`;
        const publishResponse = await fetchGraphApi(publishUrl, { method: "POST" });
        const shortcode = await fetchShortcode(publishResponse.id, accessToken);
        return { success: true, id: shortcode };

    } catch (error: any) {
        console.error("Instagram Video Upload Error:", error);
        throw new Error(`Failed to publish video: ${error.message}`);
    }
}

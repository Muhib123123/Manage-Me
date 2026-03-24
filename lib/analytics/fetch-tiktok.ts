import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────
// TikTok Analytics Fetcher
// ─────────────────────────────────────────────

export interface TiktokAnalyticsData {
    followers: number | null;
    videoViews: number | null;
    likes: number | null;
    malePercent: number | null;
    femalePercent: number | null;
}

export async function fetchTiktokAnalytics(
    userId: string
): Promise<TiktokAnalyticsData | null> {
    const connection = await prisma.platformConnection.findFirst({
        where: { userId, platform: "TIKTOK" },
    });

    if (!connection) return null;

    const token = connection.accessToken;

    try {
        // Fetch user info (followers, likes, video views)
        const userRes = await fetch(
            "https://open.tiktokapis.com/v2/user/info/?fields=follower_count,following_count,likes_count,video_views",
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        );

        let followers: number | null = null;
        let videoViews: number | null = null;
        let likes: number | null = null;

        if (userRes.ok) {
            const userJson = await userRes.json();
            const data = userJson?.data?.user ?? {};
            followers = data.follower_count ?? null;
            videoViews = data.video_views ?? null;
            likes = data.likes_count ?? null;
        }

        // TikTok gender data is only available via Creator Marketplace API (requires approval)
        // Gracefully fall back to null
        const malePercent: number | null = null;
        const femalePercent: number | null = null;

        return { followers, videoViews, likes, malePercent, femalePercent };
    } catch (error) {
        console.error(`❌ Failed to fetch TikTok analytics for user ${userId}:`, error);
        return null;
    }
}

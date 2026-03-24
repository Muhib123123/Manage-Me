import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────
// Instagram Analytics Fetcher
// ─────────────────────────────────────────────

export interface InstagramAnalyticsData {
    followers: number | null;
    views: number | null;
    malePercent: number | null;
    femalePercent: number | null;
}

export async function fetchInstagramAnalytics(
    userId: string
): Promise<InstagramAnalyticsData | null> {
    const connection = await prisma.platformConnection.findFirst({
        where: { userId, platform: "INSTAGRAM" },
    });

    if (!connection || !connection.platformId) return null;

    const igUserId = connection.platformId;
    const token = connection.accessToken;
    const base = "https://graph.instagram.com/v21.0";

    try {
        // 1. Fetch current total follower count directly from User object (Live data)
        const userRes = await fetch(
            `${base}/${igUserId}?fields=followers_count&access_token=${token}`
        );
        let followers: number | null = null;
        if (userRes.ok) {
            const userJson = await userRes.json();
            followers = userJson.followers_count ?? null;
        }

        // 2. Fetch profile views from insights (Historical/Trends)
        const insightsRes = await fetch(
            `${base}/${igUserId}/insights?metric=profile_views&period=day&access_token=${token}`
        );

        let views: number | null = null;

        if (insightsRes.ok) {
            const insightsJson = await insightsRes.json();
            for (const item of insightsJson?.data ?? []) {
                const latest = item.values?.[item.values.length - 1]?.value ?? null;
                if (item.name === "profile_views") views = latest;
            }
        }

        // Fetch gender breakdown
        let malePercent: number | null = null;
        let femalePercent: number | null = null;

        try {
            const genderRes = await fetch(
                `${base}/${igUserId}/insights?metric=audience_gender_age&period=lifetime&access_token=${token}`
            );

            if (genderRes.ok) {
                const genderJson = await genderRes.json();
                const genderData = genderJson?.data?.[0]?.values?.[0]?.value ?? {};

                let maleTotal = 0;
                let femaleTotal = 0;
                let total = 0;

                for (const [key, val] of Object.entries(genderData)) {
                    const num = val as number;
                    total += num;
                    if (key.startsWith("M.")) maleTotal += num;
                    if (key.startsWith("F.")) femaleTotal += num;
                }

                if (total > 0) {
                    malePercent = Math.round((maleTotal / total) * 100);
                    femalePercent = Math.round((femaleTotal / total) * 100);
                }
            }
        } catch {
            console.warn(`⚠️ Could not fetch Instagram gender analytics for user ${userId}`);
        }

        return { followers, views, malePercent, femalePercent };
    } catch (error) {
        console.error(`❌ Failed to fetch Instagram analytics for user ${userId}:`, error);
        return null;
    }
}

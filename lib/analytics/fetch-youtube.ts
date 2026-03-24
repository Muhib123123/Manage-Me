import { prisma } from "@/lib/prisma";
import { google } from "googleapis";

// ─────────────────────────────────────────────
// YouTube Analytics Fetcher
// ─────────────────────────────────────────────

export interface YoutubeAnalyticsData {
    subscribers: number | null;
    views: number | null;
    videoViews: number | null;
    malePercent: number | null;
    femalePercent: number | null;
}

export async function fetchYoutubeAnalytics(
    userId: string
): Promise<YoutubeAnalyticsData | null> {
    const connection = await prisma.platformConnection.findFirst({
        where: { userId, platform: "YOUTUBE" },
    });

    if (!connection) return null;

    try {
        const auth = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );

        auth.setCredentials({
            access_token: connection.accessToken,
            refresh_token: connection.refreshToken ?? undefined,
        });

        const youtube = google.youtube({ version: "v3", auth });

        // Fetch channel statistics
        const channelRes = await youtube.channels.list({
            part: ["statistics"],
            mine: true,
        });

        const stats = channelRes.data.items?.[0]?.statistics;
        const subscribers = stats?.subscriberCount
            ? parseInt(stats.subscriberCount, 10)
            : null;
        const views = stats?.viewCount ? parseInt(stats.viewCount, 10) : null;
        const videoViews = stats?.videoCount
            ? parseInt(stats.videoCount, 10)
            : null;

        // Attempt to fetch gender demographics from YouTube Analytics API
        let malePercent: number | null = null;
        let femalePercent: number | null = null;

        try {
            const ytAnalytics = google.youtubeAnalytics({ version: "v2", auth });
            const endDate = new Date().toISOString().split("T")[0];
            const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0];

            const genderRes = await ytAnalytics.reports.query({
                ids: "channel==MINE",
                startDate,
                endDate,
                metrics: "viewerPercentage",
                dimensions: "gender",
            });

            const rows = genderRes.data.rows ?? [];
            for (const row of rows) {
                const gender = row[0] as string;
                const pct = row[1] as number;
                if (gender === "male") malePercent = pct;
                if (gender === "female") femalePercent = pct;
            }
        } catch {
            // Gender analytics may not be available (channel too small or scope missing)
            console.warn(`⚠️ Could not fetch YouTube gender analytics for user ${userId}`);
        }

        return { subscribers, views, videoViews, malePercent, femalePercent };
    } catch (error) {
        console.error(`❌ Failed to fetch YouTube analytics for user ${userId}:`, error);
        return null;
    }
}

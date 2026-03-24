import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { prisma } from "@/lib/prisma";
import { fetchYoutubeAnalytics } from "@/lib/analytics/fetch-youtube";
import { fetchInstagramAnalytics } from "@/lib/analytics/fetch-instagram";
import { fetchTiktokAnalytics } from "@/lib/analytics/fetch-tiktok";

// ─────────────────────────────────────────────
// Analytics Queue
// ─────────────────────────────────────────────

const redisUrl = process.env.UPSTASH_REDIS_URL;

if (!redisUrl) {
    console.warn("⚠️ UPSTASH_REDIS_URL is missing. Analytics sync will not work.");
}

const connection = new IORedis(redisUrl || "redis://localhost:6379", {
    maxRetriesPerRequest: null,
    ...(redisUrl?.startsWith("rediss://") && {
        tls: { rejectUnauthorized: false },
    }),
});

export const analyticsQueue = new Queue("analytics-sync", { connection });

export type AnalyticsPlatform = "YOUTUBE" | "INSTAGRAM" | "TIKTOK";

/**
 * Schedule an analytics snapshot job for a specific user+platform.
 * Deduplicates by jobId so we never have duplicate jobs per user/platform.
 */
export async function scheduleAnalyticsSync(
    userId: string,
    platform: AnalyticsPlatform,
    intervalMs = 2 * 60 * 1000 // 2 minutes default (down from 15m)
) {
    const jobId = `analytics:${userId}:${platform}`;

    // Remove existing job first (idempotent scheduling)
    const existingJob = await analyticsQueue.getJob(jobId);
    if (existingJob) {
        await existingJob.remove();
    }

    await analyticsQueue.add(
        "sync-snapshot",
        { userId, platform },
        {
            jobId,
            repeat: { every: intervalMs },
            removeOnComplete: 10,
            removeOnFail: 5,
        }
    );

    // Also run an immediate first snapshot
    await analyticsQueue.add(
        "sync-snapshot",
        { userId, platform },
        { removeOnComplete: 5, removeOnFail: 3 }
    );
}

/**
 * Remove all scheduled analytics jobs for a user+platform.
 * Call this when a user disconnects a platform.
 */
export async function cancelAnalyticsSync(
    userId: string,
    platform: AnalyticsPlatform
) {
    const jobId = `analytics:${userId}:${platform}`;
    const job = await analyticsQueue.getJob(jobId);
    if (job) await job.remove();
}

// ─────────────────────────────────────────────
// Worker (singleton to survive HMR)
// ─────────────────────────────────────────────

const globalForWorker = global as unknown as { analyticsWorker?: Worker };

if (!globalForWorker.analyticsWorker && redisUrl) {
    globalForWorker.analyticsWorker = new Worker(
        "analytics-sync",
        async (job) => {
            const { userId, platform } = job.data as {
                userId: string;
                platform: AnalyticsPlatform;
            };

            console.log(`📊 Analytics sync: ${platform} for user ${userId}`);

            let snapshotData: Record<string, number | null> = {};

            if (platform === "YOUTUBE") {
                const data = await fetchYoutubeAnalytics(userId);
                if (!data) return;
                snapshotData = {
                    subscribers: data.subscribers,
                    views: data.views,
                    videoViews: data.videoViews,
                    malePercent: data.malePercent,
                    femalePercent: data.femalePercent,
                };
            } else if (platform === "INSTAGRAM") {
                const data = await fetchInstagramAnalytics(userId);
                if (!data) return;
                snapshotData = {
                    followers: data.followers,
                    views: data.views,
                    malePercent: data.malePercent,
                    femalePercent: data.femalePercent,
                };
            } else if (platform === "TIKTOK") {
                const data = await fetchTiktokAnalytics(userId);
                if (!data) return;
                snapshotData = {
                    followers: data.followers,
                    videoViews: data.videoViews,
                    likes: data.likes,
                    malePercent: data.malePercent,
                    femalePercent: data.femalePercent,
                };
            }

            // Write snapshot to DB
            await prisma.analyticsSnapshot.create({
                data: {
                    userId,
                    platform,
                    ...snapshotData,
                },
            });

            // Also update the LiveView count (used by SSE stream)
            const liveCount =
                snapshotData.subscribers ?? snapshotData.followers ?? 0;

            await prisma.liveView.upsert({
                where: { userId_platform: { userId, platform } },
                update: { count: liveCount as number },
                create: { userId, platform, count: liveCount as number },
            });

            console.log(`✅ Analytics snapshot saved: ${platform} for user ${userId}`);
        },
        { connection, concurrency: 3 }
    );

    globalForWorker.analyticsWorker.on("failed", (job, err) => {
        console.error(`❌ Analytics job ${job?.id} failed:`, err);
    });
}

export const analyticsWorker = globalForWorker.analyticsWorker;

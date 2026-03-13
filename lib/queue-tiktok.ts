import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { prisma } from "./prisma";

// Use Upstash Redis URL from env
const redisUrl = process.env.UPSTASH_REDIS_URL;

if (!redisUrl) {
    console.warn("⚠️ UPSTASH_REDIS_URL is missing. Background TikTok scheduling will not work.");
}

// Global connection to reuse in dev
const connection = new IORedis(redisUrl || "redis://localhost:6379", {
    maxRetriesPerRequest: null,
    // Upstash requires TLS for rediss:// connections
    ...(redisUrl?.startsWith("rediss://") && {
        tls: { rejectUnauthorized: false },
    }),
});

export const tiktokQueue = new Queue("tiktok-uploads", { connection });

// Prevent multiple workers in development HMR
const globalForWorker = global as unknown as { tiktokWorker?: Worker };

if (!globalForWorker.tiktokWorker && redisUrl) {
    globalForWorker.tiktokWorker = new Worker(
        "tiktok-uploads",
        async (job) => {
            const { postId } = job.data;

            // Mark as uploading
            await prisma.tiktokPost.update({
                where: { id: postId },
                data: { status: "UPLOADING" },
            });

            try {
                const { publishTikTokVideo } = await import("./tiktok");
                const shareId = await publishTikTokVideo(postId);

                // Mark as done
                await prisma.tiktokPost.update({
                    where: { id: postId },
                    data: {
                        status: "DONE",
                        tiktokId: shareId,
                    },
                });

            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : "Unknown error";

                // Mark as failed with error message
                await prisma.tiktokPost.update({
                    where: { id: postId },
                    data: { status: "FAILED", errorMessage: message },
                });

                console.error(`❌ Job ${job.id}: TikTok post ${postId} publish failed:`, error);
                throw error; // Re-throw so BullMQ marks job as failed
            }
        },
        { connection, concurrency: 1 }
    );

    globalForWorker.tiktokWorker.on("failed", (job, err) => {
        console.error(`BullMQ TikTok Job ${job?.id} failed:`, err);
    });
}

export const tiktokWorker = globalForWorker.tiktokWorker;

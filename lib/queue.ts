import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { uploadVideoToYouTube, translateYouTubeError } from "./youtube";
import { prisma } from "./prisma";

// Use Upstash Redis URL from env
const redisUrl = process.env.UPSTASH_REDIS_URL;

if (!redisUrl) {
    console.warn("⚠️ UPSTASH_REDIS_URL is missing. Background video scheduling will not work.");
}

// Global connection to reuse in dev
const connection = new IORedis(redisUrl || "redis://localhost:6379", {
    maxRetriesPerRequest: null,
    // Upstash requires TLS for rediss:// connections
    ...(redisUrl?.startsWith("rediss://") && {
        tls: { rejectUnauthorized: false },
    }),
});

export const videoQueue = new Queue("youtube-uploads", { connection });
export const instagramQueue = new Queue("instagram-uploads", { connection });

// Prevent multiple workers in development HMR
const globalForWorker = global as unknown as { videoWorker?: Worker; instagramWorker?: Worker };

if (!globalForWorker.videoWorker && redisUrl) {
    globalForWorker.videoWorker = new Worker(
        "youtube-uploads",
        async (job) => {
            const { videoId } = job.data;

            // Mark as uploading
            await prisma.youtubePost.update({
                where: { id: videoId },
                data: { status: "UPLOADING" },
            });

            try {
                const youtubeVideoId = await uploadVideoToYouTube(videoId);

                // Mark as done
                await prisma.youtubePost.update({
                    where: { id: videoId },
                    data: {
                        status: "DONE",
                        youtubeId: youtubeVideoId,
                    },
                });

                console.log(`✅ Job ${job.id}: Video ${videoId} uploaded successfully!`);
            } catch (error: any) {
                // Mark as failed with error message
                await prisma.youtubePost.update({
                    where: { id: videoId },
                    data: { status: "FAILED", errorMessage: translateYouTubeError(error) },
                });
                console.error(`❌ Job ${job.id}: Video ${videoId} upload failed:`, error);
                throw error; // Re-throw so BullMQ marks job as failed
            }
        },
        { connection, concurrency: 1 }
    );

    globalForWorker.videoWorker.on("failed", (job, err) => {
        console.error(`BullMQ Job ${job?.id} failed:`, err);
    });
}

// NOTE: Instagram worker lives in lib/queue-instagram.ts to avoid duplicate processing.
// We only export the videoWorker from this file.
export const videoWorker = globalForWorker.videoWorker;

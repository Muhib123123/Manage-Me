import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { uploadToInstagram } from "./instagram";
import { prisma } from "./prisma";

// Use Upstash Redis URL from env
const redisUrl = process.env.UPSTASH_REDIS_URL;

if (!redisUrl) {
    console.warn("⚠️ UPSTASH_REDIS_URL is missing. Background Instagram scheduling will not work.");
}

// Global connection to reuse in dev
const connection = new IORedis(redisUrl || "redis://localhost:6379", {
    maxRetriesPerRequest: null,
    // Upstash requires TLS for rediss:// connections
    ...(redisUrl?.startsWith("rediss://") && {
        tls: { rejectUnauthorized: false },
    }),
});

export const instagramQueue = new Queue("instagram-uploads", { connection });

// Prevent multiple workers in development HMR
const globalForWorker = global as unknown as { instagramWorker?: Worker };

if (!globalForWorker.instagramWorker && redisUrl) {
    globalForWorker.instagramWorker = new Worker(
        "instagram-uploads",
        async (job) => {
            const { postId } = job.data;

            // Mark as uploading
            await prisma.instagramPost.update({
                where: { id: postId },
                data: { status: "UPLOADING" },
            });

            try {
                const instagramId = await uploadToInstagram(postId);

                // Mark as done
                await prisma.instagramPost.update({
                    where: { id: postId },
                    data: {
                        status: "DONE",
                        instagramId: instagramId,
                    },
                });

                console.log(`✅ Job ${job.id}: Instagram post ${postId} uploaded successfully!`);
            } catch (error: any) {
                // Mark as failed with error message
                await prisma.instagramPost.update({
                    where: { id: postId },
                    data: { status: "FAILED", errorMessage: error.message || "Unknown error occurred" },
                });
                console.error(`❌ Job ${job.id}: Instagram post ${postId} upload failed:`, error);
                throw error; // Re-throw so BullMQ marks job as failed
            }
        },
        { connection, concurrency: 1 }
    );

    globalForWorker.instagramWorker.on("failed", (job, err) => {
        console.error(`BullMQ Job ${job?.id} failed:`, err);
    });
}

export const instagramWorker = globalForWorker.instagramWorker;

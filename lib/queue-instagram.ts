import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
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
                const post = await prisma.instagramPost.findUnique({
                    where: { id: postId },
                });

                if (!post) throw new Error("Instagram post not found");

                const isReel = post.mediaType === "REEL";
                const isVideo = post.mediaType === "VIDEO" || isReel;

                let igMediaId;

                const { uploadInstagramPhoto, uploadInstagramVideo } = await import("./instagram");

                if (isVideo) {
                    const res = await uploadInstagramVideo(post.userId, post.mediaUrls, post.caption || "", isReel);
                    igMediaId = res.id;
                } else {
                    const res = await uploadInstagramPhoto(post.userId, post.mediaUrls, post.caption || "");
                    igMediaId = res.id;
                }

                // Mark as done
                await prisma.instagramPost.update({
                    where: { id: postId },
                    data: {
                        status: "DONE",
                        instagramId: igMediaId,
                    },
                });

            } catch (error: any) {
                // Detect expired / revoked token errors and surface a friendly message
                const rawMsg: string = error.message || "Unknown error occurred";
                const isTokenError =
                    rawMsg.toLowerCase().includes("invalid oauth") ||
                    rawMsg.toLowerCase().includes("cannot parse access token") ||
                    rawMsg.toLowerCase().includes("token") && rawMsg.toLowerCase().includes("invalid");
                const friendlyMsg = isTokenError
                    ? "Your Instagram access has expired or been revoked. Please reconnect your Instagram account on the Connections page."
                    : rawMsg;

                await prisma.instagramPost.update({
                    where: { id: postId },
                    data: { status: "FAILED", errorMessage: friendlyMsg },
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

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
                    const res = await uploadInstagramVideo(post.userId, post.storageUrl, post.caption || "", isReel);
                    igMediaId = res.id;
                } else {
                    const res = await uploadInstagramPhoto(post.userId, post.storageUrl, post.caption || "");
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

                console.log(`✅ Job ${job.id}: Instagram Post ${postId} uploaded successfully!`);
            } catch (error: any) {
                // Mark as failed with error message
                await prisma.instagramPost.update({
                    where: { id: postId },
                    data: { status: "FAILED", errorMessage: error?.message || "Unknown error" },
                });
                console.error(`❌ Job ${job.id}: Instagram Post ${postId} upload failed:`, error);
                throw error; // Re-throw so BullMQ marks job as failed
            }
        },
        { connection, concurrency: 1 }
    );

    globalForWorker.instagramWorker.on("failed", (job, err) => {
        console.error(`BullMQ Instagram Job ${job?.id} failed:`, err);
    });
}

export const videoWorker = globalForWorker.videoWorker;
export const instagramWorker = globalForWorker.instagramWorker;

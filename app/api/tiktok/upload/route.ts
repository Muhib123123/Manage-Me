import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tiktokQueue } from "@/lib/queue-tiktok";
import "@/lib/queue-tiktok"; // ensure worker is registered
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify TikTok connection
        const connection = await prisma.platformConnection.findUnique({
            where: { userId_platform: { userId: session.user.id, platform: "TIKTOK" } },
        });

        if (!connection) {
            return NextResponse.json({ error: "TikTok is not connected" }, { status: 400 });
        }

        const body = await req.json();
        const { videoUrl, caption, privacyLevel, allowDuet, allowStitch, allowComment, scheduledAt } = body;

        if (!videoUrl || !scheduledAt) {
            return NextResponse.json(
                { error: "Missing required fields: videoUrl, scheduledAt" },
                { status: 400 }
            );
        }

        // Parse scheduling date
        const scheduledTime = new Date(scheduledAt);
        const delay = Math.max(0, scheduledTime.getTime() - Date.now());

        // Save post to Database
        const post = await prisma.tiktokPost.create({
            data: {
                userId: session.user.id,
                videoUrl,
                caption: caption?.trim() || null,
                privacyLevel: privacyLevel || "PUBLIC_TO_EVERYONE",
                allowDuet: allowDuet ?? true,
                allowStitch: allowStitch ?? true,
                allowComment: allowComment ?? true,
                scheduledAt: scheduledTime,
                status: "PENDING",
            },
        });

        // Enqueue the tiktok-upload BullMQ job with the scheduled delay
        await tiktokQueue.add(`tiktok-upload-${post.id}`, { postId: post.id }, { delay });

        return NextResponse.json(post);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal server error";
        console.error("TikTok Upload API Error:", error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

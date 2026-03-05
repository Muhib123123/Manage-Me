import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { instagramQueue } from "@/lib/queue";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify Instagram connection
        const connection = await prisma.platformConnection.findUnique({
            where: { userId_platform: { userId: session.user.id, platform: "INSTAGRAM" } }
        });

        if (!connection) {
            return NextResponse.json({ error: "Instagram is not connected" }, { status: 400 });
        }

        const body = await req.json();
        const { mediaType, caption, mediaUrls, scheduledAt } = body;

        if (!mediaUrls || !Array.isArray(mediaUrls) || mediaUrls.length === 0 || !scheduledAt || !mediaType) {
            return NextResponse.json(
                { error: "Missing required fields: mediaUrls, mediaType, scheduledAt" },
                { status: 400 }
            );
        }

        // Parse scheduling date
        const scheduledTime = new Date(scheduledAt);
        const delay = Math.max(0, scheduledTime.getTime() - Date.now());

        // Save post to Database
        const post = await prisma.instagramPost.create({
            data: {
                userId: session.user.id,
                mediaType, // PHOTO, VIDEO, or REEL
                caption,
                mediaUrls,
                scheduledAt: scheduledTime,
                status: "PENDING",
            },
        });

        // Add job to BullMQ queue
        await instagramQueue.add(
            `instagram-upload-${post.id}`,
            { postId: post.id },
            { delay }
        );

        return NextResponse.json(post);
    } catch (error: any) {
        console.error("Instagram Upload API Error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tiktokQueue } from "@/lib/queue-tiktok";
import { NextResponse } from "next/server";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: postId } = await params;
        const post = await prisma.tiktokPost.findUnique({
            where: { id: postId },
        });

        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        if (post.userId !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Verify connection exists
        const connection = await prisma.platformConnection.findUnique({
            where: { userId_platform: { userId: session.user.id, platform: "TIKTOK" } },
        });

        if (!connection) {
            return NextResponse.json({ error: "TikTok not connected" }, { status: 400 });
        }

        // Add immediate job to the queue
        await tiktokQueue.add(
            `tiktok-upload-immediate-${post.id}-${Date.now()}`,
            { postId: post.id },
            { delay: 0 } // run immediately
        );

        // Update post status to uploading
        await prisma.tiktokPost.update({
            where: { id: post.id },
            data: {
                status: "UPLOADING",
                errorMessage: null
            },
        });

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error("TikTok Upload Immediate Error:", error);
        const message = error instanceof Error ? error.message : "Internal server error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

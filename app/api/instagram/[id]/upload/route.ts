import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/instagram/[id]/upload
 *
 * Manually triggers an immediate publish of a scheduled Instagram post.
 * Used when the user clicks the "⬆ Now" button on the Instagram dashboard.
 */
export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify the post belongs to this user
    const post = await prisma.instagramPost.findFirst({
        where: { id, userId: session.user.id },
    });

    if (!post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.status === "DONE") {
        return NextResponse.json(
            { error: "Post already published", instagramId: post.instagramId },
            { status: 400 }
        );
    }

    if (post.status === "UPLOADING") {
        return NextResponse.json({ error: "Upload already in progress" }, { status: 400 });
    }

    try {
        // Mark as uploading so the UI immediately reflects the state change
        await prisma.instagramPost.update({
            where: { id },
            data: { status: "UPLOADING" },
        });

        // Enqueue to the background worker so the API route doesn't timeout
        // Instagram videos can take 5+ minutes to process.
        const { instagramQueue } = await import("@/lib/queue-instagram");
        await instagramQueue.add(`instagram-upload-${post.id}`, { postId: post.id });

        return NextResponse.json({ success: true, queued: true });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";

        // Mark as failed if we couldn't even enqueue
        await prisma.instagramPost.update({
            where: { id },
            data: { status: "FAILED", errorMessage: message },
        });

        console.error(`[Instagram Upload Now] Post ${id} failed:`, err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

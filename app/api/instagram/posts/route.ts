import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/instagram/posts — fetch all Instagram posts for the logged-in user
export async function GET() {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const posts = await prisma.instagramPost.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(posts);
}

// POST /api/instagram/posts — schedule a new Instagram post
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
        caption,
        mediaType,
        mediaUrls,
        scheduledAt,
    } = body;

    // Basic validation
    if (!mediaUrls || !Array.isArray(mediaUrls) || mediaUrls.length === 0 || !scheduledAt || !mediaType) {
        return NextResponse.json(
            { error: "Missing required fields: mediaUrls, mediaType, scheduledAt" },
            { status: 400 }
        );
    }

    const post = await prisma.instagramPost.create({
        data: {
            userId: session.user.id,
            caption: caption ?? "",
            mediaType,
            mediaUrls,
            scheduledAt: new Date(scheduledAt),
            status: "PENDING",
        },
    });

    // Phase 7: Enqueue BullMQ job for Instagram upload
    try {
        const { instagramQueue, instagramWorker } = await import("@/lib/queue-instagram");
        // Start worker in dev
        if (instagramWorker) instagramWorker.resume();

        // Calculate delay in milliseconds from now until scheduledAt
        const delay = Math.max(0, post.scheduledAt.getTime() - Date.now());

        await instagramQueue.add(
            "upload-instagram",
            { postId: post.id },
            { delay }
        );
    } catch (queueErr) {
        console.error("Failed to enqueue instagram upload:", queueErr);
        // We still return 201 because the post was saved
    }

    return NextResponse.json(post, { status: 201 });
}

// DELETE /api/instagram/posts?id=xxx — cancel a scheduled post
export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing post id" }, { status: 400 });

    // Ensure the post belongs to this user
    const post = await prisma.instagramPost.findFirst({
        where: { id, userId: session.user.id },
    });

    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (post.status !== "PENDING" && post.status !== "FAILED") {
        return NextResponse.json(
            { error: "Can only cancel PENDING or FAILED posts" },
            { status: 400 }
        );
    }

    await prisma.instagramPost.delete({ where: { id } });
    return NextResponse.json({ success: true });
}

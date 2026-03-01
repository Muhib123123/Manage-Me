import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/videos — fetch all videos for the logged-in user
export async function GET() {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const videos = await prisma.youtubePost.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(videos);
}

// POST /api/videos — save a new scheduled video
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
        title,
        description,
        tags,
        privacy,
        videoType,
        storageUrl,
        thumbnailUrl,
        scheduledAt,
    } = body;

    // Basic validation
    if (!title || !storageUrl || !scheduledAt) {
        return NextResponse.json(
            { error: "Missing required fields: title, storageUrl, scheduledAt" },
            { status: 400 }
        );
    }

    const video = await prisma.youtubePost.create({
        data: {
            userId: session.user.id,
            title,
            description: description ?? "",
            tags: tags ?? [],
            privacy: privacy ?? "public",
            videoType: videoType ?? "video",
            storageUrl,
            thumbnailUrl: thumbnailUrl ?? null,
            scheduledAt: new Date(scheduledAt),
            status: "PENDING",
        },
    });


    // Phase 4: Enqueue BullMQ job with delay
    try {
        const { videoQueue, videoWorker } = await import("@/lib/queue");
        // Start worker in dev
        if (videoWorker) videoWorker.resume();

        // Calculate delay in milliseconds from now until scheduledAt
        const delay = Math.max(0, video.scheduledAt.getTime() - Date.now());

        await videoQueue.add(
            "upload-video",
            { videoId: video.id },
            { delay }
        );
        console.log(`✅ Queued video ${video.id} to upload in ${Math.round(delay / 1000)}s`);
    } catch (queueErr) {
        console.error("Failed to enqueue video upload:", queueErr);
        // We still return 201 because the video was saved, but the scheduling failed
    }

    return NextResponse.json(video, { status: 201 });
}

// DELETE /api/videos?id=xxx — cancel a scheduled video
export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing video id" }, { status: 400 });

    // Ensure the video belongs to this user
    const video = await prisma.youtubePost.findFirst({
        where: { id, userId: session.user.id },
    });

    if (!video) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (video.status !== "PENDING") {
        return NextResponse.json(
            { error: "Can only cancel PENDING videos" },
            { status: 400 }
        );
    }

    await prisma.youtubePost.delete({ where: { id } });
    return NextResponse.json({ success: true });
}

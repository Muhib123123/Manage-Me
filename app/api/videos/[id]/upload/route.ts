import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadVideoToYouTube } from "@/lib/youtube";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/videos/[id]/upload
 *
 * Manually triggers an upload of a specific video to YouTube.
 * In Phase 4 this will be called automatically by the BullMQ worker;
 * for now you can trigger it manually to test the YouTube upload flow.
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

    // Verify the video belongs to this user and is in a uploadable state
    const video = await prisma.video.findFirst({
        where: { id, userId: session.user.id },
    });

    if (!video) {
        return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    if (video.status === "DONE") {
        return NextResponse.json(
            { error: "Video already uploaded", youtubeUrl: video.youtubeUrl },
            { status: 400 }
        );
    }

    if (video.status === "UPLOADING") {
        return NextResponse.json({ error: "Upload already in progress" }, { status: 400 });
    }

    try {
        // Mark as uploading
        await prisma.video.update({
            where: { id },
            data: { status: "UPLOADING" },
        });

        // Perform the YouTube upload
        const youtubeVideoId = await uploadVideoToYouTube(id);
        const youtubeUrl = `https://www.youtube.com/watch?v=${youtubeVideoId}`;

        // Mark as done
        await prisma.video.update({
            where: { id },
            data: {
                status: "DONE",
                youtubeId: youtubeVideoId,
                youtubeUrl,
            },
        });

        return NextResponse.json({ success: true, youtubeUrl, youtubeId: youtubeVideoId });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";

        // Mark as failed
        await prisma.video.update({
            where: { id },
            data: { status: "FAILED", errorMessage: message },
        });

        console.error(`[YouTube Upload] Video ${id} failed:`, err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

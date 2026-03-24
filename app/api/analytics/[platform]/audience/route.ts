import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ platform: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { platform } = await params;
    const normalizedPlatform = platform.toUpperCase();

    const snapshot = await prisma.analyticsSnapshot.findFirst({
        where: {
            userId: session.user.id,
            platform: normalizedPlatform,
            // Only include snapshots that actually have gender data
            OR: [
                { malePercent: { not: null } },
                { femalePercent: { not: null } },
            ],
        },
        orderBy: { snapshotAt: "desc" },
        select: {
            malePercent: true,
            femalePercent: true,
            otherPercent: true,
            snapshotAt: true,
        },
    });

    return NextResponse.json({ audience: snapshot });
}

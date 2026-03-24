import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getUserPlan } from "@/lib/subscription";
import { validateRange, rangeToStartDate } from "@/lib/analytics/gate";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ platform: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { platform } = await params;
    const normalizedPlatform = platform.toUpperCase();
    const { searchParams } = new URL(req.url);
    const rangeParam = searchParams.get("range") ?? "1d";

    const plan = await getUserPlan(session.user.id);

    let range;
    try {
        range = validateRange(plan, rangeParam);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 403 });
    }

    const since = rangeToStartDate(range);

    const snapshots = await prisma.analyticsSnapshot.findMany({
        where: {
            userId: session.user.id,
            platform: normalizedPlatform,
            snapshotAt: { gte: since },
        },
        orderBy: { snapshotAt: "asc" },
        select: {
            snapshotAt: true,
            subscribers: true,
            followers: true,
            views: true,
            videoViews: true,
            likes: true,
        },
    });

    return NextResponse.json({ snapshots, range, plan });
}

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { getUserPlan } from "@/lib/subscription";
import { analyticsQueue } from "@/lib/analytics/queue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ platform: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 });
    }

    const plan = await getUserPlan(session.user.id);

    if (plan !== "CREATOR") {
        return new Response(
            JSON.stringify({
                error: "Live subscriber counter is a Creator feature. Upgrade to unlock real-time data.",
            }),
            { status: 403, headers: { "Content-Type": "application/json" } }
        );
    }

    const { platform } = await params;
    const normalizedPlatform = platform.toUpperCase();
    const userId = session.user.id;

    // SSE stream
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const send = (data: object) => {
                controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
                );
            };

            // Send initial count immediately
            const initial = await prisma.liveView.findUnique({
                where: { userId_platform: { userId, platform: normalizedPlatform } },
            });
            send({ count: initial?.count ?? 0 });

            // Trigger an immediate background sync so the count is fresh
            await analyticsQueue.add(
                "sync-snapshot",
                { userId, platform: normalizedPlatform },
                { removeOnComplete: 5, removeOnFail: 3 }
            );

            // Poll every 10 seconds and push deltas
            let lastCount = initial?.count ?? 0;
            const interval = setInterval(async () => {
                try {
                    const current = await prisma.liveView.findUnique({
                        where: { userId_platform: { userId, platform: normalizedPlatform } },
                    });
                    const newCount = current?.count ?? lastCount;
                    if (newCount !== lastCount) {
                        lastCount = newCount;
                        send({ count: newCount });
                    } else {
                        // Send heartbeat to keep connection alive
                        send({ heartbeat: true, count: newCount });
                    }
                } catch {
                    clearInterval(interval);
                    controller.close();
                }
            }, 10_000);

            // Clean up on disconnect
            return () => clearInterval(interval);
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
        },
    });
}

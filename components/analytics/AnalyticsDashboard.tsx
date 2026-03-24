import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserPlan } from "@/lib/subscription";
import { GrowthSummaryCard } from "./GrowthSummaryCard";
import { SubscriberGrowthChart } from "./SubscriberGrowthChart";
import { GenderBreakdown } from "./GenderBreakdown";
import { LiveSubscriberCounter } from "./LiveSubscriberCounter";
import { ProfileViewsChart } from "./ProfileViewsChart";

interface Props {
    platform: "YOUTUBE" | "INSTAGRAM" | "TIKTOK";
}

export async function AnalyticsDashboard({ platform }: Props) {
    const session = await auth();
    if (!session?.user?.id) return null;

    const userId = session.user.id;
    const plan = await getUserPlan(userId);

    // Fetch the two most recent snapshots for delta calculation
    const [latest, previous, audience] = await Promise.all([
        prisma.analyticsSnapshot.findFirst({
            where: { userId, platform },
            orderBy: { snapshotAt: "desc" },
        }),
        prisma.analyticsSnapshot.findFirst({
            where: {
                userId, platform,
                snapshotAt: { lt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) },
            },
            orderBy: { snapshotAt: "desc" },
        }),
        prisma.analyticsSnapshot.findFirst({
            where: {
                userId, platform,
                OR: [{ malePercent: { not: null } }, { femalePercent: { not: null } }],
            },
            orderBy: { snapshotAt: "desc" },
        }),
    ]);

    const primaryNow = latest?.subscribers ?? latest?.followers ?? null;
    const primaryPrevious = previous?.subscribers ?? previous?.followers ?? null;
    const trend = primaryNow !== null && primaryPrevious !== null
        ? primaryNow - primaryPrevious
        : null;

    const liveCount = platform === "YOUTUBE" ? (latest?.subscribers ?? 0) : (latest?.followers ?? 0);

    return (
        <section className="mb-16">
            <div className="flex items-center gap-3 mb-6 px-1">
                <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-violet-500 to-indigo-600 shadow-sm" />
                <h2 className="text-xl font-bold tracking-tight text-[var(--text)]">Analytics Overview</h2>
            </div>

            <div className="flex flex-col gap-5">
                {/* Row 1: Summary stats */}
                <GrowthSummaryCard
                    subscribers={latest?.subscribers ?? null}
                    followers={latest?.followers ?? null}
                    views={latest?.views ?? null}
                    platform={platform}
                    trend={trend}
                />

                {/* Row 2: Growth chart + Live counter */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                        <SubscriberGrowthChart
                            platform={platform}
                            plan={plan}
                        />
                    </div>
                    <div>
                        <LiveSubscriberCounter
                            platform={platform}
                            plan={plan}
                            initialCount={liveCount}
                        />
                    </div>
                </div>

                {/* Row 3: Profile views + Gender */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ProfileViewsChart platform={platform} plan={plan} />
                    <GenderBreakdown
                        malePercent={audience?.malePercent ?? null}
                        femalePercent={audience?.femalePercent ?? null}
                        otherPercent={audience?.otherPercent ?? null}
                    />
                </div>
            </div>
        </section>
    );
}

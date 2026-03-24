import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { VideoRow } from "@/components/VideoRow";
import { UnifiedPost } from "@/types";
import { AutoRefresh } from "@/components/AutoRefresh";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string; success?: string }>;
}) {
    const { error, success } = await searchParams;
    const session = await auth();
    const userId = session!.user.id;

    const [ytPending, ytPublished, ytFailed, connection] = await Promise.all([
        // YouTube
        prisma.youtubePost.findMany({
            where: { userId, status: { in: ["PENDING", "UPLOADING"] } },
            orderBy: { scheduledAt: "asc" },
        }),
        prisma.youtubePost.findMany({
            where: { userId, status: "DONE" },
            orderBy: { updatedAt: "desc" },
        }),
        prisma.youtubePost.findMany({
            where: { userId, status: "FAILED" },
            orderBy: { updatedAt: "desc" },
        }),
        prisma.platformConnection.findFirst({
            where: { userId, platform: "YOUTUBE" }
        })
    ]);

    if (!connection) {
        redirect("/connect?error=Please connect your YouTube account first.");
    }

    const normalizeYT = (posts: typeof ytPending): UnifiedPost[] =>
        posts.map(p => ({
            id: p.id, platform: "YOUTUBE", title: p.title,
            mediaType: p.videoType, status: p.status, scheduledAt: p.scheduledAt,
            storageUrl: p.storageUrl, thumbnailUrl: p.thumbnailUrl,
            errorMessage: p.errorMessage, platformId: p.youtubeId, privacy: p.privacy
        }));

    const pending = normalizeYT(ytPending);
    const published = normalizeYT(ytPublished);
    const failed = normalizeYT(ytFailed);

    return (
        <div className="p-6">
            <AutoRefresh enabled={pending.length > 0} interval={10} />
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium dark:bg-red-950/30 dark:border-red-900 dark:text-red-400">
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-medium dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-400">
                    Successfully connected {success}!
                </div>
            )}

            {/* ── Page Header ───────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text)] mb-3">
                        YouTube Studio
                    </h1>
                    <p className="text-[var(--muted)] text-base max-w-lg leading-relaxed">
                        Manage your scheduled and published YouTube content, track analytics, and monitor performance.
                    </p>
                </div>
                <Link href="/youtube-dashboard/upload" className="w-full sm:w-auto px-6 py-3 uppercase tracking-wider bg-[var(--text)] hover:bg-[var(--text)]/90 text-[var(--surface)] font-bold text-xs rounded-full transition-all shadow-md hover:shadow-lg dark:shadow-none text-center flex items-center justify-center cursor-pointer">
                    Schedule New Video <span className="ml-2 text-lg leading-none">+</span>
                </Link>
            </div>

            {/* ── Stats bar ─────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-16">
                <StatCard label="Scheduled" value={pending.length} color="blue" />
                <StatCard label="Published" value={published.length} color="green" />
                <StatCard label="Failed" value={failed.length} color="red" />
            </div>

            {/* ── Pending Section ───────────────────────── */}
            <Section title="📅 Scheduled" count={pending.length} statusColor="amber">
                {pending.length === 0 ? (
                    <EmptyState
                        icon="📅"
                        message="No scheduled uploads yet"
                        cta="Schedule your video →"
                        href="/youtube-dashboard/upload"
                    />
                ) : (
                    <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                        {pending.map((p) => <VideoRow key={p.id} post={p} />)}
                    </div>
                )}
            </Section>

            {/* ── Failed Section ─────────────────────────── */}
            {failed.length > 0 && (
                <Section title="❌ Failed" count={failed.length} statusColor="red">
                    <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                        {failed.map((p) => <VideoRow key={p.id} post={p} showError />)}
                    </div>
                </Section>
            )}

            {/* ── Published Section ──────────────────────── */}
            <Section title="✅ Published" count={published.length} statusColor="green">
                {published.length === 0 ? (
                    <EmptyState
                        icon="✅"
                        message="No published posts yet"
                        cta="They'll appear here after scheduled uploads complete."
                    />
                ) : (
                    <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                        {published.map((p) => <VideoRow key={p.id} post={p} />)}
                    </div>
                )}
            </Section>

            {/* ── Analytics ─────────────────────────────── */}
            <AnalyticsDashboard platform="YOUTUBE" />
        </div>
    );
}

/* ── Sub-components ──────────────────────────────── */

const STAT_COLORS: Record<string, string> = {
    blue: "bg-blue-50/50 text-blue-700 border-blue-100/60 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30",
    green: "bg-emerald-50/50 text-emerald-700 border-emerald-100/60 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30",
    red: "bg-red-50/50 text-red-700 border-red-100/60 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30",
};

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className={`p-6 rounded-[24px] border shadow-sm ${STAT_COLORS[color]} flex flex-col gap-2 transition-all hover:shadow-md`}>
            <span className="text-sm font-medium opacity-80">{label} Queue</span>
            <span className="text-4xl font-semibold tracking-tight">{value}</span>
        </div>
    );
}

const SECTION_BADGE: Record<string, string> = {
    amber: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400",
    green: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400",
    red: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400",
};

function Section({
    title, count, statusColor, children,
}: {
    title: string;
    count: number;
    statusColor: string;
    children: React.ReactNode;
}) {
    void count; void SECTION_BADGE; void statusColor;
    return (
        <div className="mb-12">
            <div className="flex items-center gap-3 mb-6 px-1">
                <div className="w-1.5 h-6 rounded-full bg-[var(--border-solid)] shadow-sm" />
                <h2 className="text-xl font-bold tracking-tight text-[var(--text)]">{title}</h2>
            </div>
            {children}
        </div>
    );
}

function EmptyState({ icon, message, cta, href }: {
    icon: string; message: string; cta: string; href?: string;
}) {
    return (
        <div className="py-10 px-6 rounded-xl border border-dashed border-[var(--border-solid)] text-center bg-[var(--surface)]">
            <div className="text-3xl mb-2">{icon}</div>
            <p className="text-[var(--muted)] text-sm mb-3">{message}</p>
            {href ? (
                <Link href={href} className="text-blue-600 text-sm font-medium hover:underline">
                    {cta}
                </Link>
            ) : (
                <p className="text-[var(--muted)] text-xs">{cta}</p>
            )}
        </div>
    );
}

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { VideoRow } from "@/components/VideoRow";

export default async function DashboardPage() {
    const session = await auth();
    const userId = session!.user.id;

    const [pending, published, failed] = await Promise.all([
        prisma.video.findMany({
            where: { userId, status: { in: ["PENDING", "UPLOADING"] } },
            orderBy: { scheduledAt: "asc" },
            select: {
                id: true, title: true, videoType: true, status: true,
                scheduledAt: true, privacy: true,
                storageUrl: true, thumbnailUrl: true,
                youtubeId: true, errorMessage: true,
            },
        }),
        prisma.video.findMany({
            where: { userId, status: "DONE" },
            orderBy: { updatedAt: "desc" },
            select: {
                id: true, title: true, videoType: true, status: true,
                scheduledAt: true, privacy: true,
                storageUrl: true, thumbnailUrl: true,
                youtubeId: true, errorMessage: true,
            },
        }),
        prisma.video.findMany({
            where: { userId, status: "FAILED" },
            orderBy: { updatedAt: "desc" },
            select: {
                id: true, title: true, videoType: true, status: true,
                scheduledAt: true, privacy: true,
                storageUrl: true, thumbnailUrl: true,
                youtubeId: true, errorMessage: true,
            },
        }),
    ]);

    // Map youtubeId → full URL
    const toRows = (videos: typeof pending) =>
        videos.map((v) => ({
            ...v,
            youtubeUrl: v.youtubeId ? `https://www.youtube.com/watch?v=${v.youtubeId}` : null,
        }));

    return (
        <div className="p-6">
            {/* ── Page Header ───────────────────────────── */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight mb-1">
                        Your Videos
                    </h1>
                    <p className="text-[var(--muted)] text-sm">
                        Manage your scheduled and published YouTube content.
                    </p>
                </div>
                <Link href="/upload" className="btn-primary shrink-0 ml-4">
                    + Schedule New Video
                </Link>
            </div>

            {/* ── Stats bar ─────────────────────────────── */}
            <div className="grid grid-cols-3 gap-4 mb-8">
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
                        cta="Schedule your first video →"
                        href="/upload"
                    />
                ) : (
                    <div className="flex flex-col gap-3">
                        {toRows(pending).map((v) => <VideoRow key={v.id} video={v} />)}
                    </div>
                )}
            </Section>

            {/* ── Failed Section ─────────────────────────── */}
            {failed.length > 0 && (
                <Section title="❌ Failed" count={failed.length} statusColor="red">
                    <div className="flex flex-col gap-3">
                        {toRows(failed).map((v) => <VideoRow key={v.id} video={v} showError />)}
                    </div>
                </Section>
            )}

            {/* ── Published Section ──────────────────────── */}
            <Section title="✅ Published" count={published.length} statusColor="green">
                {published.length === 0 ? (
                    <EmptyState
                        icon="✅"
                        message="No published videos yet"
                        cta="They'll appear here after scheduled uploads complete."
                    />
                ) : (
                    <div className="flex flex-col gap-3">
                        {toRows(published).map((v) => <VideoRow key={v.id} video={v} />)}
                    </div>
                )}
            </Section>
        </div>
    );
}

/* ── Sub-components ──────────────────────────────── */

const STAT_COLORS: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900",
    green: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900",
    red: "bg-red-50 text-red-700 border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900",
};

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className={`p-4 rounded-xl border ${STAT_COLORS[color]} flex items-center justify-between`}>
            <span className="text-sm font-medium">{label}</span>
            <span className="text-2xl font-bold">{value}</span>
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
    return (
        <div className="mb-8">
            <div className="flex items-center gap-2.5 mb-3">
                <h2 className="text-sm font-semibold text-[var(--text)]">{title}</h2>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${SECTION_BADGE[statusColor]}`}>
                    {count}
                </span>
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

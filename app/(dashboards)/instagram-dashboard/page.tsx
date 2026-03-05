import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { VideoRow } from "@/components/VideoRow";
import { UnifiedPost } from "@/types";

export default async function InstagramDashboardPage() {
    const session = await auth();
    const userId = session!.user.id;

    const [igPending, igPublished, igFailed] = await Promise.all([
        prisma.instagramPost.findMany({
            where: { userId, status: { in: ["PENDING", "UPLOADING"] } },
            orderBy: { scheduledAt: "asc" },
        }),
        prisma.instagramPost.findMany({
            where: { userId, status: "DONE" },
            orderBy: { updatedAt: "desc" },
        }),
        prisma.instagramPost.findMany({
            where: { userId, status: "FAILED" },
            orderBy: { updatedAt: "desc" },
        }),
    ]);

    const normalizeIG = (posts: typeof igPending): UnifiedPost[] =>
        posts.map(p => ({
            id: p.id, platform: "INSTAGRAM", title: p.caption || "Instagram Post",
            mediaType: p.mediaType, status: p.status, scheduledAt: p.scheduledAt,
            storageUrl: p.mediaUrls[0], thumbnailUrl: null,
            errorMessage: p.errorMessage, platformId: p.instagramId
        }));

    const pending = normalizeIG(igPending);
    const published = normalizeIG(igPublished);
    const failed = normalizeIG(igFailed);

    return (
        <div className="p-6">
            {/* ── Page Header ───────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)] tracking-tight mb-2">
                        Instagram Schedule
                    </h1>
                    <p className="text-[var(--muted)] text-sm sm:text-base max-w-lg leading-relaxed">
                        Manage your scheduled photos, videos, and Reels for Instagram.
                    </p>
                </div>
                <Link href="/instagram-dashboard/upload" className="dark:bg-blue-950 bg-blue-500 text-white px-4 py-3 rounded-lg flex items-center gap-2">
                    <span>+ Schedule Post</span>
                </Link>
            </div>

            {/* ── Stats bar ─────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                <StatCard label="Scheduled" value={pending.length} color="blue" />
                <StatCard label="Published" value={published.length} color="green" />
                <StatCard label="Failed" value={failed.length} color="red" />
            </div>

            {/* ── Pending Section ───────────────────────── */}
            <Section title="📅 Scheduled" count={pending.length} statusColor="amber">
                {pending.length === 0 ? (
                    <EmptyState
                        icon="📅"
                        message="No scheduled posts yet"
                        cta="Schedule your first post →"
                        href="/instagram-dashboard/upload"
                    />
                ) : (
                    <div className="flex flex-col gap-3">
                        {pending.map((p) => <VideoRow key={p.id} post={p} />)}
                    </div>
                )}
            </Section>

            {/* ── Failed Section ─────────────────────────── */}
            {failed.length > 0 && (
                <Section title="❌ Failed" count={failed.length} statusColor="red">
                    <div className="flex flex-col gap-3">
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
                    <div className="flex flex-col gap-3">
                        {published.map((p) => <VideoRow key={p.id} post={p} />)}
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

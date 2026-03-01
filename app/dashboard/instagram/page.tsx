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
            storageUrl: p.storageUrl, thumbnailUrl: null,
            errorMessage: p.errorMessage, platformId: p.instagramId
        }));

    const pending = normalizeIG(igPending);
    const published = normalizeIG(igPublished);
    const failed = normalizeIG(igFailed);

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* ── Page Header ───────────────────────────── */}
            <div className="flex items-start justify-between mb-10 border-b border-[var(--border-solid)] pb-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-fuchsia-50 text-fuchsia-600 rounded-xl flex items-center justify-center text-xl">
                            📸
                        </div>
                        <h1 className="text-3xl font-['Playfair_Display'] font-medium text-[var(--text)] tracking-tight">
                            Instagram Schedule
                        </h1>
                    </div>
                    <p className="text-[var(--muted)] text-sm">
                        Manage your scheduled photos, videos, and Reels for Instagram.
                    </p>
                </div>
                <Link href="/upload/instagram" className="px-6 py-3 bg-[var(--text)] text-[var(--surface)] text-sm font-semibold rounded-lg hover:bg-[var(--text)]/90 transition-all shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] dark:shadow-none whitespace-nowrap">
                    + Prepare Post
                </Link>
            </div>

            {/* ── Stats bar ─────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <StatCard label="Scheduled" value={pending.length} color="blue" />
                <StatCard label="Published" value={published.length} color="green" />
                <StatCard label="Failed" value={failed.length} color="red" />
            </div>

            <div className="flex flex-col gap-10">
                {/* ── Pending Section ───────────────────────── */}
                <Section title="Ready to Publish" count={pending.length} statusColor="amber">
                    {pending.length === 0 ? (
                        <EmptyState
                            icon="📅"
                            message="No scheduled posts right now"
                            cta="Create your first post →"
                            href="/upload/instagram"
                        />
                    ) : (
                        <div className="flex flex-col gap-4">
                            {pending.map((p) => <VideoRow key={p.id} post={p} />)}
                        </div>
                    )}
                </Section>

                {/* ── Failed Section ─────────────────────────── */}
                {failed.length > 0 && (
                    <Section title="Failed Uploads" count={failed.length} statusColor="red">
                        <div className="flex flex-col gap-4">
                            {failed.map((p) => <VideoRow key={p.id} post={p} showError />)}
                        </div>
                    </Section>
                )}

                {/* ── Published Section ──────────────────────── */}
                {published.length > 0 && (
                    <Section title="Published" count={published.length} statusColor="green">
                        <div className="flex flex-col gap-4">
                            {published.map((p) => <VideoRow key={p.id} post={p} />)}
                        </div>
                    </Section>
                )}
            </div>
        </div>
    );
}

/* ── Sub-components ──────────────────────────────── */

const STAT_COLORS: Record<string, string> = {
    blue: "bg-[var(--surface-2)] text-[var(--text)] border-[var(--border-solid)]",
    green: "bg-[var(--surface-2)] text-[var(--text)] border-[var(--border-solid)]",
    red: "bg-red-50 text-red-700 border-red-100",
};

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className={`p-6 rounded-2xl border ${STAT_COLORS[color]} flex flex-col gap-1 transition-all hover:border-[var(--text)]/30`}>
            <span className="text-sm font-medium text-[var(--muted)]">{label}</span>
            <span className="text-3xl font-bold font-['Playfair_Display'] tracking-tight">{value}</span>
        </div>
    );
}

const SECTION_BADGE: Record<string, string> = {
    amber: "bg-[var(--surface-2)] text-[var(--text)] border-[var(--border-solid)]",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    red: "bg-red-50 text-red-700 border-red-200",
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
        <div>
            <div className="flex items-center gap-3 mb-4 pb-2 border-b border-[var(--border-solid)]/50">
                <h2 className="text-lg font-semibold text-[var(--text)]">{title}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${SECTION_BADGE[statusColor]}`}>
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
        <div className="py-12 px-6 rounded-2xl border border-dashed border-[var(--border-solid)] text-center bg-[var(--surface-2)]/30 flex flex-col items-center justify-center">
            <div className="text-4xl mb-3 opacity-80">{icon}</div>
            <p className="text-[var(--text)] font-medium mb-4">{message}</p>
            {href ? (
                <Link href={href} className="text-[var(--text)] text-sm font-semibold hover:opacity-70 underline underline-offset-4 decoration-[var(--border-solid)] transition-all">
                    {cta}
                </Link>
            ) : (
                <p className="text-[var(--muted)] text-xs">{cta}</p>
            )}
        </div>
    );
}

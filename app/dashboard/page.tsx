import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { VideoRow } from "@/components/VideoRow";

export default async function DashboardPage() {
    const session = await auth();
    const userId = session!.user.id;

    // Fetch all videos for this user
    const [pending, published, failed] = await Promise.all([
        prisma.video.findMany({
            where: { userId, status: { in: ["PENDING", "UPLOADING"] } },
            orderBy: { scheduledAt: "asc" },
        }),
        prisma.video.findMany({
            where: { userId, status: "DONE" },
            orderBy: { updatedAt: "desc" },
        }),
        prisma.video.findMany({
            where: { userId, status: "FAILED" },
            orderBy: { updatedAt: "desc" },
        }),
    ]);

    return (
        <div style={{ maxWidth: "1100px" }}>
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "36px",
                }}
            >
                <div>
                    <h1
                        style={{
                            fontSize: "26px",
                            fontWeight: 800,
                            letterSpacing: "-0.5px",
                            marginBottom: "4px",
                        }}
                    >
                        Your Videos
                    </h1>
                    <p style={{ color: "var(--muted)", fontSize: "14px" }}>
                        Manage your scheduled and published YouTube content
                    </p>
                </div>

                <Link href="/upload" className="btn-primary" style={{ fontSize: "14px" }}>
                    <span>+</span> Schedule New Video
                </Link>
            </div>

            {/* ── Pending Section ───────────────────────── */}
            <Section
                title="📅 Pending"
                subtitle="Waiting to be published"
                count={pending.length}
                accent="#f5a623"
            >
                {pending.length === 0 ? (
                    <EmptyState
                        icon="📅"
                        message="No scheduled uploads yet"
                        cta="Schedule your first video"
                        href="/upload"
                    />
                ) : (
                    <div style={{ display: "grid", gap: "12px" }}>
                        {pending.map((v) => (
                            <VideoRow key={v.id} video={v} />
                        ))}
                    </div>
                )}
            </Section>

            {/* ── Failed Section ─────────────────────────── */}
            {failed.length > 0 && (
                <Section
                    title="❌ Failed"
                    subtitle="These uploads encountered errors"
                    count={failed.length}
                    accent="#ff3b5c"
                >
                    <div style={{ display: "grid", gap: "12px" }}>
                        {failed.map((v) => (
                            <VideoRow key={v.id} video={v} showError />
                        ))}
                    </div>
                </Section>
            )}

            {/* ── Published Section ──────────────────────── */}
            <Section
                title="✅ Published"
                subtitle="Successfully uploaded to YouTube"
                count={published.length}
                accent="#22c55e"
            >
                {published.length === 0 ? (
                    <EmptyState
                        icon="✅"
                        message="No published videos yet"
                        cta="They'll appear here after scheduled uploads complete"
                    />
                ) : (
                    <div style={{ display: "grid", gap: "12px" }}>
                        {published.map((v) => (
                            <VideoRow key={v.id} video={v} />
                        ))}
                    </div>
                )}
            </Section>
        </div>
    );
}

/* ── Sub-components ──────────────────────────────── */

function Section({
    title,
    subtitle,
    count,
    accent,
    children,
}: {
    title: string;
    subtitle: string;
    count: number;
    accent: string;
    children: React.ReactNode;
}) {
    return (
        <div style={{ marginBottom: "40px" }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "16px",
                }}
            >
                <h2 style={{ fontSize: "16px", fontWeight: 700 }}>{title}</h2>
                <span
                    style={{
                        padding: "2px 10px",
                        borderRadius: "100px",
                        fontSize: "12px",
                        fontWeight: 600,
                        background: `${accent}22`,
                        color: accent,
                        border: `1px solid ${accent}44`,
                    }}
                >
                    {count}
                </span>
                <span style={{ color: "var(--muted)", fontSize: "13px" }}>{subtitle}</span>
            </div>
            {children}
        </div>
    );
}

function EmptyState({
    icon,
    message,
    cta,
    href,
}: {
    icon: string;
    message: string;
    cta: string;
    href?: string;
}) {
    return (
        <div
            style={{
                padding: "48px 24px",
                borderRadius: "16px",
                border: "1px dashed var(--border)",
                textAlign: "center",
                background: "var(--surface)",
            }}
        >
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>{icon}</div>
            <p style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "16px" }}>
                {message}
            </p>
            {href && (
                <Link
                    href={href}
                    style={{
                        color: "var(--primary)",
                        fontSize: "13px",
                        fontWeight: 600,
                        textDecoration: "none",
                    }}
                >
                    {cta} →
                </Link>
            )}
            {!href && (
                <p style={{ color: "var(--muted)", fontSize: "12px" }}>{cta}</p>
            )}
        </div>
    );
}



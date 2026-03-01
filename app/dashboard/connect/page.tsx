import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function HubPage({ searchParams }: { searchParams: Promise<{ error?: string, success?: string }> }) {
    const session = await auth();
    if (!session) redirect("/login");

    const params = await searchParams;

    const connections = await prisma.platformConnection.findMany({
        where: { userId: session.user.id },
    });

    const hasYoutube = connections.some(c => c.platform === "YOUTUBE");
    const ytConnection = connections.find(c => c.platform === "YOUTUBE");

    const hasInstagram = connections.some(c => c.platform === "INSTAGRAM");

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto">
            <div className="mb-12 md:mb-16">
                <h1 className="text-3xl md:text-5xl font-['Playfair_Display'] font-medium tracking-tight mb-4">
                    Platform Connections
                </h1>
                <p className="text-[var(--muted)] text-sm md:text-base max-w-2xl leading-relaxed">
                    Connect your social media accounts to schedule and publish posts directly from Manage Me.
                </p>
            </div>

            {params.error && (
                <div className="mb-8 px-5 py-4 rounded-xl bg-red-50 text-red-700 text-sm font-medium border border-red-100 flex items-center gap-3">
                    <span className="text-lg">⚠</span> Connection failed: {params.error}
                </div>
            )}

            {params.success && (
                <div className="mb-8 px-5 py-4 rounded-xl bg-[var(--surface-2)] text-[var(--text)] text-sm font-medium border border-[var(--border-solid)] flex items-center gap-3">
                    <span className="text-lg text-emerald-500">✅</span>
                    Successfully connected {params.success}!
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">

                {/* YOUTUBE CONNECTION CARD */}
                <div className="flex flex-col border-t border-[var(--border-solid)] pt-6 gap-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--text)] mb-1.5">
                                YouTube
                            </h2>
                            <p className="text-xs text-[var(--muted)] uppercase tracking-wide font-semibold">
                                {hasYoutube ? <span className="text-emerald-500">Connected</span> : <span className="text-[var(--muted)]">Not Connected</span>}
                            </p>
                        </div>
                    </div>

                    <p className="text-sm text-[var(--muted)] leading-relaxed h-[60px]">
                        Connect your YouTube account to upload long-form videos and Shorts. We request minimum permissions needed for upload.
                    </p>

                    {hasYoutube && ytConnection ? (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-4 bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border-solid)]">
                                {ytConnection.platformAvatar ? (
                                    <img src={ytConnection.platformAvatar} alt="Channel Avatar" className="w-10 h-10 rounded-full border border-[var(--border-solid)]" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-[var(--border-solid)] flex items-center justify-center text-xs font-medium text-[var(--text)]">YT</div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate text-[var(--text)]">{ytConnection.platformName || "YouTube Channel"}</p>
                                    <p className="text-xs text-[var(--muted)] truncate mt-0.5">ID: {ytConnection.platformId}</p>
                                </div>
                            </div>
                            <Link
                                href="/api/youtube/connect"
                                className="text-sm font-medium text-[var(--muted)] hover:text-[var(--text)] transition-colors inline-flex justify-center py-2"
                            >
                                Switch Channel
                            </Link>
                        </div>
                    ) : (
                        <div>
                            <Link
                                href="/api/youtube/connect"
                                className="inline-flex w-full items-center justify-center border border-[var(--border-solid)] hover:border-[var(--text)] hover:bg-[var(--surface-2)] transition-colors duration-300 text-[var(--text)] px-6 py-3.5 rounded-lg text-sm font-medium"
                            >
                                Connect YouTube
                            </Link>
                        </div>
                    )}
                </div>

                {/* INSTAGRAM CONNECTION CARD (Placeholder) */}
                <div className="flex flex-col border-t border-[var(--border-solid)] pt-6 gap-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--muted)] mb-1.5 opacity-60">
                                Instagram
                            </h2>
                            <p className="text-xs text-[var(--muted)] uppercase tracking-wide font-semibold opacity-60">
                                Coming Soon
                            </p>
                        </div>
                    </div>

                    <p className="text-sm text-[var(--muted)] leading-relaxed h-[60px] opacity-60">
                        Connect your Instagram Professional account to schedule photos and reels. Support for Instagram is currently in development.
                    </p>

                    <div>
                        <button
                            disabled
                            className="inline-flex w-full items-center justify-center border border-dashed border-[var(--border-solid)] text-[var(--muted)] px-6 py-3.5 rounded-lg text-sm font-medium cursor-not-allowed bg-[var(--surface-2)]/50"
                        >
                            Under Construction
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}

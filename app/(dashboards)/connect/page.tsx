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
    const igConnection = connections.find(c => c.platform === "INSTAGRAM");

    const hasTiktok = connections.some(c => c.platform === "TIKTOK");
    const ttConnection = connections.find(c => c.platform === "TIKTOK");

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
            <div className="mb-12 md:mb-16">
                <h1 className="text-3xl md:text-5xl font-medium text-[var(--text)] tracking-tight mb-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">

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

                    <p className="text-sm text-[var(--muted)] leading-relaxed">
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

                {/* INSTAGRAM CONNECTION CARD */}
                <div className="flex flex-col border-t border-[var(--border-solid)] pt-6 gap-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--text)] mb-1.5 ">
                                Instagram
                            </h2>
                            <p className="text-xs text-[var(--muted)] uppercase tracking-wide font-semibold ">
                                {hasInstagram ? <span className="text-emerald-500">Connected</span> : <span className="text-[var(--muted)]">Not Connected</span>}
                            </p>
                        </div>
                    </div>

                    <p className="text-sm text-[var(--muted)] leading-relaxed">
                        Connect your Instagram Professional account to schedule photos and reels. You must link your account to a Facebook Page first.
                    </p>

                    {hasInstagram && igConnection ? (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-4 bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border-solid)]">
                                {igConnection.platformAvatar ? (
                                    <img src={igConnection.platformAvatar} alt="Profile Avatar" className="w-10 h-10 rounded-full border border-[var(--border-solid)]" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-[var(--border-solid)] flex items-center justify-center text-xs font-medium text-[var(--text)]">IG</div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate text-[var(--text)]">@{igConnection.platformName || "Instagram Account"}</p>
                                    <p className="text-xs text-[var(--muted)] truncate mt-0.5">ID: {igConnection.platformId}</p>
                                </div>
                            </div>
                            <Link
                                href="/api/instagram/connect"
                                className="text-sm font-medium text-[var(--muted)] hover:text-[var(--text)] transition-colors inline-flex justify-center py-2"
                            >
                                Switch Account
                            </Link>
                        </div>
                    ) : (
                        <div>
                            <Link
                                href="/api/instagram/connect"
                                className="inline-flex w-full items-center justify-center border border-[var(--border-solid)] hover:border-[var(--text)] hover:bg-[var(--surface-2)] transition-colors duration-300 text-[var(--text)] px-6 py-3.5 rounded-lg text-sm font-medium cursor-pointer"
                            >
                                Connect Instagram
                            </Link>
                        </div>
                    )}
                </div>

                {/* TIKTOK CONNECTION CARD */}
                <div className="flex flex-col border-t border-[var(--border-solid)] pt-6 gap-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--text)] mb-1.5">
                                TikTok
                            </h2>
                            <p className="text-xs text-[var(--muted)] uppercase tracking-wide font-semibold">
                                {hasTiktok ? <span className="text-emerald-500">Connected</span> : <span className="text-[var(--muted)]">Not Connected</span>}
                            </p>
                        </div>
                    </div>

                    <p className="text-sm text-[var(--muted)] leading-relaxed">
                        Connect your TikTok account to schedule and publish videos. Requires TikTok Developer app review for production.
                    </p>

                    {hasTiktok && ttConnection ? (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-4 bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border-solid)]">
                                {ttConnection.platformAvatar ? (
                                    <img src={ttConnection.platformAvatar} alt="Profile Avatar" className="w-10 h-10 rounded-full border border-[var(--border-solid)]" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-[var(--border-solid)] flex items-center justify-center text-xs font-medium text-[var(--text)]">TT</div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate text-[var(--text)]">@{ttConnection.platformName || "TikTok Account"}</p>
                                    <p className="text-xs text-[var(--muted)] truncate mt-0.5">ID: {ttConnection.platformId}</p>
                                </div>
                            </div>
                            <Link
                                href="/api/tiktok/connect"
                                className="text-sm font-medium text-[var(--muted)] hover:text-[var(--text)] transition-colors inline-flex justify-center py-2"
                            >
                                Switch Account
                            </Link>
                        </div>
                    ) : (
                        <div>
                            <Link
                                href="/api/tiktok/connect"
                                className="inline-flex w-full items-center justify-center border border-[var(--border-solid)] hover:border-[var(--text)] hover:bg-[var(--surface-2)] transition-colors duration-300 text-[var(--text)] px-6 py-3.5 rounded-lg text-sm font-medium cursor-pointer"
                            >
                                Connect TikTok
                            </Link>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

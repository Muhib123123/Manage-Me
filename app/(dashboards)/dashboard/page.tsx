import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";
import {
    Link as LinkIcon,
    UploadCloud,
    CalendarClock,
    ArrowRight
} from "lucide-react";

export default async function DashboardPage() {
    const session = await auth();
    if (!session) redirect("/login");

    const connections = await prisma.platformConnection.findMany({
        where: { userId: session.user.id },
    });

    const hasYoutube = connections.some(c => c.platform === "YOUTUBE");
    const hasInstagram = connections.some(c => c.platform === "INSTAGRAM");
    const hasTiktok = connections.some(c => c.platform === "TIKTOK");
    const hasAnyConnection = hasYoutube || hasInstagram || hasTiktok;

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto min-h-[calc(100vh-80px)] flex flex-col justify-center">

            {/* ── Header ── */}
            <div className="mb-12 text-center">
                <div className="inline-flex items-center justify-center lg:w-24 lg:h-24 w-16 h-16 rounded-2xl mb-6 shadow-sm overflow-hidden bg-[var(--surface-2)]">
                    <Image src="/logo.png" alt="Manage Me Logo" width={96} height={96} />
                </div>
                <h1 className="text-4xl md:text-5xl font-medium text-[var(--text)] tracking-tight mb-4 animate-fade-up">
                    Welcome to <span className="text-[var(--manage)] font-bold">Manage</span> <span className="text-[var(--me)] font-bold">Me</span>
                </h1>
                <p className="text-[var(--muted)] text-base md:text-lg max-w-2xl mx-auto leading-relaxed animate-fade-up" style={{ animationDelay: "100ms" }}>
                    Your centralized hub for cross-platform content scheduling.
                    Manage YouTube, Instagram, and TikTok from a single, unified studio.
                </p>
            </div>

            {/* ── 3-Step Guide ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 px-4 md:px-0">

                {/* Step 1 */}
                <div className="bg-[var(--surface)] border border-[var(--border-solid)] rounded-2xl p-8 relative overflow-hidden group hover:border-[var(--text)] transition-colors duration-300 animate-fade-up" style={{ animationDelay: "200ms" }}>
                    <div className="absolute top-0 right-0 p-6 text-[120px] font-black text-[var(--surface-2)] leading-none select-none opacity-50 -mt-10 -mr-6 transition-transform duration-500 group-hover:scale-110">1</div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-[var(--surface-2)] flex items-center justify-center mb-6">
                            <LinkIcon className="w-6 h-6 text-[var(--text)]" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-[var(--text)]">Connect</h3>
                        <p className="text-sm text-[var(--muted)] leading-relaxed">
                            Link your social channels. We request the minimum permissions needed to publish on your behalf.
                        </p>
                    </div>
                </div>

                {/* Step 2 */}
                <div className="bg-[var(--surface)] border border-[var(--border-solid)] rounded-2xl p-8 relative overflow-hidden group hover:border-[var(--text)] transition-colors duration-300 animate-fade-up" style={{ animationDelay: "300ms" }}>
                    <div className="absolute top-0 right-0 p-6 text-[120px] font-black text-[var(--surface-2)] leading-none select-none opacity-50 -mt-10 -mr-6 transition-transform duration-500 group-hover:scale-110">2</div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-[var(--surface-2)] flex items-center justify-center mb-6">
                            <UploadCloud className="w-6 h-6 text-[var(--text)]" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-[var(--text)]">Upload</h3>
                        <p className="text-sm text-[var(--muted)] leading-relaxed">
                            Drop your media files into our studios and add titles, tags, and platform-specific metadata.
                        </p>
                    </div>
                </div>

                {/* Step 3 */}
                <div className="bg-[var(--surface)] border border-[var(--border-solid)] rounded-2xl p-8 relative overflow-hidden group hover:border-[var(--text)] transition-colors duration-300 animate-fade-up" style={{ animationDelay: "400ms" }}>
                    <div className="absolute top-0 right-0 p-6 text-[120px] font-black text-[var(--surface-2)] leading-none select-none opacity-50 -mt-10 -mr-6 transition-transform duration-500 group-hover:scale-110">3</div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-[var(--surface-2)] flex items-center justify-center mb-6">
                            <CalendarClock className="w-6 h-6 text-[var(--text)]" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-[var(--text)]">Schedule</h3>
                        <p className="text-sm text-[var(--muted)] leading-relaxed">
                            Pick a date and time. Our robust background engine handles the rest, posting precisely when you want.
                        </p>
                    </div>
                </div>

            </div>

            {/* ── Call to Action ── */}
            <div className="flex flex-col items-center animate-fade-up" style={{ animationDelay: "500ms" }}>
                {!hasAnyConnection ? (
                    <div className="text-center">
                        <p className="text-sm text-[var(--muted)] mb-4 font-medium uppercase tracking-wider">Ready to start?</p>
                        <Link
                            href="/connect"
                            className="inline-flex items-center gap-2 bg-[var(--text)] text-[var(--surface)] px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition-all duration-200 hover:scale-[1.02] active:scale-95 group"
                        >
                            Connect Your First Account
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                ) : (
                    <div className="text-center">
                        <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-4 font-medium uppercase tracking-wider">You're connected and ready to schedule.</p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            {hasYoutube && (
                                <Link
                                    href="/youtube-dashboard/upload"
                                    className="inline-flex items-center justify-center w-[200px] border border-[var(--border-solid)] bg-[var(--surface-2)] text-[var(--text)] px-6 py-3.5 rounded-xl font-medium hover:border-[var(--text)] transition-all duration-200"
                                >
                                    New YouTube Video
                                </Link>
                            )}
                            {hasInstagram && (
                                <Link
                                    href="/instagram-dashboard/upload"
                                    className="inline-flex items-center justify-center w-[200px] border border-[var(--border-solid)] bg-[var(--surface-2)] text-[var(--text)] px-6 py-3.5 rounded-xl font-medium hover:border-[var(--text)] transition-all duration-200"
                                >
                                    New Instagram Post
                                </Link>
                            )}
                            {hasTiktok && (
                                <Link
                                    href="/tiktok-dashboard/upload"
                                    className="inline-flex items-center justify-center w-[200px] border border-[var(--border-solid)] bg-[var(--surface-2)] text-[var(--text)] px-6 py-3.5 rounded-xl font-medium hover:border-[var(--text)] transition-all duration-200"
                                >
                                    New TikTok Video
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}

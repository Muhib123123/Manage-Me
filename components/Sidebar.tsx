"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useUpload } from "@/contexts/UploadContext";

type NavItem = { href: string; label: string; icon: string; disabled?: boolean };

const navMain: NavItem[] = [
    { href: "/youtube-dashboard", label: "YouTube Hub", icon: "🎬" },
    { href: "/instagram-dashboard", label: "Instagram Hub", icon: "📸" },
    { href: "/connect", label: "Connections", icon: "🔗" },
];

const navUpload: NavItem[] = [
    { href: "/youtube-dashboard/upload", label: "YouTube Upload", icon: "⬆️" },
    { href: "/instagram-dashboard/upload", label: "Instagram Upload", icon: "⬆️" },
];

interface SidebarProps {
    onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
    const path = usePathname();
    const router = useRouter();
    const { isUploading } = useUpload();

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        if (!isUploading) return; // no guard needed
        e.preventDefault();
        const confirmed = window.confirm(
            "⚠️ An upload is in progress!\n\nLeaving this page will cancel your upload. Are you sure you want to leave?"
        );
        if (confirmed) {
            router.push(href);
        }
    };

    return (
        <aside className="w-[220px] h-full min-h-screen bg-[var(--surface)] border-r border-[var(--border-solid)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-5 border-b border-[var(--border-solid)]">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-base shrink-0">
                        🎬
                    </div>
                    <span className="font-extrabold text-sm gradient-text">Manage Me</span>
                </div>
                {/* Close button – mobile only */}
                {onClose && (
                    <button
                        onClick={onClose}
                        className="lg:hidden p-1 rounded-md text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* Upload in-progress warning banner */}
            {isUploading && (
                <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm animate-pulse">⬆️</span>
                        <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                            Upload in progress…
                        </p>
                    </div>
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5">
                        Don't navigate away
                    </p>
                </div>
            )}

            {/* Nav Main */}
            <nav className="px-3 py-4 flex flex-col gap-0.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] px-2 mb-2">
                    Menu
                </p>
                {navMain.map(({ href, label, icon }) => {
                    const active = path === href;
                    return (
                        <Link
                            key={href}
                            href={href}
                            onClick={(e) => handleNavClick(e, href)}
                            className={[
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium no-underline",
                                "transition-all duration-150 border-l-[3px]",
                                active
                                    ? "bg-blue-50 text-blue-700 border-blue-600 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-500"
                                    : "text-[var(--muted)] border-transparent hover:bg-[var(--surface-2)] hover:text-[var(--text)]",
                                isUploading && !active ? "opacity-60" : "",
                            ].join(" ")}
                        >
                            <span className="text-base leading-none">{icon}</span>
                            <span>{label}</span>
                            {isUploading && !active && (
                                <span className="ml-auto text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                                    ⚠
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Nav Uploads */}
            <nav className="flex-1 px-3 py-0 flex flex-col gap-0.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] px-2 mb-2 mt-2">
                    Schedule
                </p>
                {navUpload.map((item) => {
                    const active = path === item.href;
                    if (item.disabled) {
                        return (
                            <div
                                key={item.label}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium border-l-[3px] border-transparent text-[var(--muted)] opacity-50 cursor-not-allowed"
                            >
                                <span className="text-base leading-none">{item.icon}</span>
                                <span>{item.label}</span>
                            </div>
                        )
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={(e) => handleNavClick(e, item.href)}
                            className={[
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium no-underline",
                                "transition-all duration-150 border-l-[3px]",
                                active
                                    ? "bg-blue-50 text-blue-700 border-blue-600 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-500"
                                    : "text-[var(--muted)] border-transparent hover:bg-[var(--surface-2)] hover:text-[var(--text)]",
                                isUploading && !active ? "opacity-60" : "",
                            ].join(" ")}
                        >
                            <span className="text-base leading-none">{item.icon}</span>
                            <span>{item.label}</span>
                            {isUploading && !active && (
                                <span className="ml-auto text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                                    ⚠
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-[var(--border-solid)]">
                <p className="text-[10px] text-[var(--muted)] leading-relaxed">
                    Manage Me · YouTube Scheduler
                </p>
            </div>
        </aside>
    );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { X, Zap } from "lucide-react";
import { useUpload } from "@/contexts/UploadContext";
import { useConfirm } from "@/components/ConfirmDialog";
import type { ReactNode } from "react";
import Image from "next/image";

/* ─── Brand SVG Icons ─────────────────────────────── */

function YouTubeLogo({ size = 20 }: { size?: number }) {
    const h = Math.round(size * 0.7);
    return (
        <svg width={size} height={h} viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="28" height="20" rx="5" fill="#FF0000" />
            <path d="M11.5 6v8l7-4-7-4z" fill="white" />
        </svg>
    );
}

function InstagramLogo({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="ig-sidebar" cx="30%" cy="107%" r="150%">
                    <stop offset="0%" stopColor="#fdf497" />
                    <stop offset="5%" stopColor="#fdf497" />
                    <stop offset="45%" stopColor="#fd5949" />
                    <stop offset="60%" stopColor="#d6249f" />
                    <stop offset="90%" stopColor="#285AEB" />
                </radialGradient>
            </defs>
            <rect width="24" height="24" rx="6" fill="url(#ig-sidebar)" />
            <rect x="6.5" y="6.5" width="11" height="11" rx="3" stroke="white" strokeWidth="1.5" fill="none" />
            <circle cx="12" cy="12" r="2.8" stroke="white" strokeWidth="1.5" fill="none" />
            <circle cx="16.2" cy="7.8" r="0.8" fill="white" />
        </svg>
    );
}

function TikTokLogo({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="48" rx="10" fill="#010101" />
            <path
                d="M32 10h-5v19.3a5.2 5.2 0 01-5.2 5.1 5.2 5.2 0 01-5.2-5.1 5.2 5.2 0 015.2-5.1c.5 0 1 .1 1.4.2V19a10.5 10.5 0 00-1.4-.1A10.5 10.5 0 0011.3 29.3a10.5 10.5 0 0010.5 10.5 10.5 10.5 0 0010.5-10.5V19.8a17.2 17.2 0 0010 3.2v-5.3A11.8 11.8 0 0132 10z"
                fill="white"
            />
            <path d="M32 10h-5v19.3a5.2 5.2 0 01-5.2 5.1" stroke="#69C9D0" strokeWidth="1.2" fill="none" />
            <path d="M13.5 24a10.5 10.5 0 000 10" stroke="#EE1D52" strokeWidth="1.2" fill="none" />
        </svg>
    );
}


function LinkIcon({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
        </svg>
    );
}

function LockIcon({ size = 16 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
    );
}

/* ─── Nav data ────────────────────────────────────── */

type NavItem = { href: string; label: string; icon: ReactNode; platformKey?: string; disabled?: boolean };

const navMain: NavItem[] = [
    { href: "/youtube-dashboard", label: "YouTube Hub", icon: <YouTubeLogo />, platformKey: "YOUTUBE" },
    { href: "/instagram-dashboard", label: "Instagram Hub", icon: <InstagramLogo />, platformKey: "INSTAGRAM" },
    { href: "/tiktok-dashboard", label: "TikTok Hub", icon: <TikTokLogo />, platformKey: "TIKTOK" },
    { href: "/connect", label: "Connections", icon: <LinkIcon size={18} /> },
];

const navUpload: NavItem[] = [
    { href: "/youtube-dashboard/upload", label: "YouTube Upload", icon: "⬆️", platformKey: "YOUTUBE" },
    { href: "/instagram-dashboard/upload", label: "Instagram Upload", icon: "⬆️", platformKey: "INSTAGRAM" },
    { href: "/tiktok-dashboard/upload", label: "TikTok Upload", icon: "⬆️", platformKey: "TIKTOK" },
];

/* ─── Component ───────────────────────────────────── */

interface SidebarProps { onClose?: () => void; connections?: string[]; plan?: string; }

export default function Sidebar({ onClose, connections = [], plan = "FREE" }: SidebarProps) {
    const path = usePathname();
    const router = useRouter();
    const { isUploading } = useUpload();
    const confirm = useConfirm();
    const isFree = plan === "FREE";

    const handleNavClick = async (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        if (!isUploading) {
            onClose?.();
            return;
        }
        e.preventDefault();
        const confirmed = await confirm({
            title: "Upload in Progress",
            message: "Leaving this page will cancel your current upload. Are you sure you want to leave?",
            confirmLabel: "Yes, leave page",
            cancelLabel: "Stay here",
            variant: "warning"
        });
        if (confirmed) {
            router.push(href);
            onClose?.();
        }
    };

    const renderLink = (item: NavItem) => {
        const isLocked = item.platformKey ? !connections.includes(item.platformKey) : false;
        const active = path === item.href;

        if (isLocked) {
            return (
                <div key={item.href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium border-l-[3px] border-transparent text-[var(--muted)] opacity-50 cursor-not-allowed">
                    <span className="shrink-0 leading-none flex items-center grayscale">{item.icon}</span>
                    <span>{item.label}</span>
                    <span className="ml-auto text-xs opacity-70"><LockIcon /></span>
                </div>
            );
        }

        return (
            <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className={[
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium no-underline",
                    "border-l-[3px]",
                    active
                        ? "bg-blue-50 text-blue-700 border-blue-600 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-500"
                        : "text-[var(--muted)] border-transparent hover:bg-[var(--surface-2)] hover:text-[var(--text)]",
                    isUploading && !active ? "opacity-60" : "",
                ].join(" ")}
            >
                <span className="shrink-0 leading-none flex items-center">{item.icon}</span>
                <span>{item.label}</span>
                {isUploading && !active && (
                    <span className="ml-auto text-[10px] text-amber-600 dark:text-amber-400 font-semibold">⚠</span>
                )}
            </Link>
        );
    };

    return (
        <aside className="w-[220px] h-full min-h-screen bg-[var(--surface)] border-r border-[var(--border-solid)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-5 border-b border-[var(--border-solid)]">
                <Link 
                    href="/"
                    onClick={(e) => handleNavClick(e, "/")}
                    className="flex items-center gap-2.5 h-10 cursor-pointer"
                >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-base shrink-0">
                        <Image src="/logo.png" alt="Logo" width={40} height={40} />
                    </div>
                    <span className="font-extrabold text-md"><span className="text-[var(--manage)]">Manage</span><span className="text-[var(--me)] ml-1">Me</span></span>
                </Link>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="lg:hidden p-1 rounded-md text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
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
                        <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">Upload in progress…</p>
                    </div>
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5">Don't navigate away</p>
                </div>
            )}

            {/* Nav Main */}
            <nav className="px-3 py-4 flex flex-col gap-0.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] px-2 mb-2">Menu</p>
                {navMain.map((item) => {
                    if (item.disabled) {
                        return (
                            <div key={item.label} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium border-l-[3px] border-transparent text-[var(--muted)] opacity-50 cursor-not-allowed">
                                <span className="shrink-0 leading-none flex items-center">{item.icon}</span>
                                <span>{item.label}</span>
                            </div>
                        );
                    }
                    return renderLink(item);
                })}
            </nav>

            {/* Nav Uploads */}
            <nav className="flex-1 px-3 py-0 flex flex-col gap-0.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] px-2 mb-2 mt-2">Schedule</p>
                {navUpload.map((item) => {
                    if (item.disabled) {
                        return (
                            <div key={item.label} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium border-l-[3px] border-transparent text-[var(--muted)] opacity-50 cursor-not-allowed">
                                <span className="shrink-0 leading-none flex items-center">{item.icon}</span>
                                <span>{item.label}</span>
                            </div>
                        );
                    }
                    return renderLink(item);
                })}
            </nav>

            {/* Upgrade CTA — Free plan only */}
            {isFree && (
                <div className="mx-3 mb-3">
                    <Link
                        href="/pricing"
                        className="
                            flex items-center gap-2 px-3 py-2.5 rounded-lg no-underline
                            bg-[var(--accent)]/8 border border-[var(--accent)]/20
                            text-[var(--accent)] text-xs font-semibold
                            hover:bg-[var(--accent)]/15 hover:border-[var(--accent)]/40
                        "
                    >
                        <Zap size={13} className="shrink-0" />
                        <span>Upgrade to Creator</span>
                        <span className="ml-auto text-[10px] opacity-70">→</span>
                    </Link>
                </div>
            )}

            {/* Footer */}
            <div className="px-5 py-4 border-t border-[var(--border-solid)]">
                <p className="text-[10px] text-[var(--muted)] leading-relaxed">Manage Me · Social Scheduler</p>
            </div>
        </aside>
    );
}

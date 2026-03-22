"use client";

import { signOut } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";
import { Menu, Zap } from "lucide-react";
import Link from "next/link";

interface TopbarProps {
    user: { name?: string | null; email?: string | null; image?: string | null };
    plan?: string;
    onMenuClick?: () => void;
}

export default function Topbar({ user, plan, onMenuClick }: TopbarProps) {
    const isFree = !plan || plan === "FREE";

    return (
        <header className="h-14 bg-[var(--surface)] border-b border-[var(--border-solid)] flex items-center justify-between px-4 md:px-6 shrink-0">
            {/* Left */}
            <div className="flex items-center gap-3">
                {/* Hamburger — mobile only */}
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
                    aria-label="Open menu"
                >
                    <Menu size={20} />
                </button>

                <div className="flex items-center gap-1.5 text-sm">
                    <span className="text-[var(--muted)] hidden sm:inline">Welcome back,</span>
                    <span className="font-semibold text-[var(--text)]">
                        {user.name?.split(" ")[0] ?? "Creator"}
                    </span>
                    <span>👋</span>
                </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2 md:gap-3">

                {/* Upgrade badge — only for Free plan users */}
                {isFree && (
                    <Link
                        href="/pricing"
                        className="
                            hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold
                            bg-[var(--accent)]/10 text-[var(--accent)]
                            border border-[var(--accent)]/25
                            hover:bg-[var(--accent)]/20 hover:border-[var(--accent)]/50
                            no-underline
                        "
                    >
                        <Zap size={11} className="shrink-0" />
                        Upgrade to Creator
                    </Link>
                )}

                <ThemeToggle />

                {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={user.image}
                        alt={user.name ?? "User"}
                        width={32}
                        height={32}
                        className="rounded-full border-2 border-[var(--border-solid)] shrink-0"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {user.name?.[0] ?? "U"}
                    </div>
                )}

                <span className="text-sm font-medium text-[var(--text)] hidden md:block max-w-[140px] truncate">
                    {user.name ?? user.email}
                </span>

                <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="px-3 py-1.5 rounded-lg border border-[var(--border-solid)] bg-transparent text-[var(--muted)] text-xs font-medium cursor-pointer hover:text-[var(--text)] hover:border-[var(--primary)] hover:bg-[var(--surface-2)]"
                >
                    <span className="hidden sm:inline">Sign out</span>
                    <span className="sm:hidden">↩</span>
                </button>
            </div>
        </header>
    );
}

"use client";

import { signOut } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";
import { Menu } from "lucide-react";

interface TopbarProps {
    user: { name?: string | null; email?: string | null; image?: string | null };
    onMenuClick?: () => void;
}

export default function Topbar({ user, onMenuClick }: TopbarProps) {
    return (
        <header className="h-14 bg-[var(--surface)] border-b border-[var(--border-solid)] flex items-center justify-between px-4 md:px-6 shrink-0">
            {/* Left */}
            <div className="flex items-center gap-3">
                {/* Hamburger — mobile only */}
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
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
                    className="px-3 py-1.5 rounded-lg border border-[var(--border-solid)] bg-transparent text-[var(--muted)] text-xs font-medium cursor-pointer transition-all duration-150 hover:text-[var(--text)] hover:border-[var(--primary)] hover:bg-[var(--surface-2)]"
                >
                    <span className="hidden sm:inline">Sign out</span>
                    <span className="sm:hidden">↩</span>
                </button>
            </div>
        </header>
    );
}

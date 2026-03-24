"use client";

import { signOut } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";
import { Menu, Zap, LogOut, Trash2, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useConfirm } from "./ConfirmDialog";

interface TopbarProps {
    user: { id?: string; name?: string | null; email?: string | null; image?: string | null };
    plan?: string;
    onMenuClick?: () => void;
}

export default function Topbar({ user, plan, onMenuClick }: TopbarProps) {
    const isFree = !plan || plan === "FREE";
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const confirm = useConfirm();

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        if (isDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isDropdownOpen]);

    const handleDeleteAccount = async () => {
        setIsDropdownOpen(false);
        
        const isCreator = plan === "CREATOR";
        
        const confirmed = await confirm({
            title: "Delete Account",
            message: isCreator 
                ? "As a Creator, your account contains significant data. To confirm you want to permanently delete everything (posts, analytics, and connections), please type DELETE below."
                : "Are you absolutely sure you want to delete your account? This will permanently delete all your posts, analytics, platform connections, and data. This action cannot be undone.",
            confirmLabel: "Yes, entirely delete account",
            cancelLabel: "Cancel",
            variant: "danger",
            requiredInput: isCreator ? "DELETE" : undefined,
        });

        if (confirmed) {
            try {
                const res = await fetch("/api/user", { method: "DELETE" });
                if (res.ok) {
                    await signOut({ callbackUrl: "/" });
                } else {
                    alert("Failed to delete account. Please try again or contact support.");
                }
            } catch (error) {
                console.error("Deletion error:", error);
                alert("Something went wrong deleting the account.");
            }
        }
    };

    return (
        <header className="h-14 bg-[var(--surface)] border-b border-[var(--border-solid)] flex items-center justify-between px-4 md:px-6 shrink-0 z-40 relative">
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
                {/* Upgrade badge — only for Free plan users */}
                {isFree && (
                    <Link
                        href="/pricing"
                        className="
                            hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold
                            bg-[var(--accent)]/10 text-[var(--accent)]
                            border border-[var(--accent)]/25
                            hover:bg-[var(--accent)]/20 hover:border-[var(--accent)]/50
                            no-underline transition-colors
                        "
                    >
                        <Zap size={11} className="shrink-0" />
                        Upgrade to Creator
                    </Link>
                )}

                <ThemeToggle />

                {/* User Dropdown */}
                <div className="relative ml-1" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 p-1 rounded-full hover:bg-[var(--surface-2)] transition-colors focus:outline-none cursor-pointer"
                    >
                        {user.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={user.image}
                                alt={user.name ?? "User"}
                                width={32}
                                height={32}
                                className="rounded-full border-2 border-[var(--border-solid)] shrink-0 object-cover"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full border-2 border-[var(--border-solid)] bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                                {user.name?.[0]?.toUpperCase() ?? "U"}
                            </div>
                        )}
                        <span className="text-sm font-medium text-[var(--text)] hidden md:block max-w-[140px] truncate pr-2">
                            {user.name ?? user.email}
                        </span>
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="absolute right-0 top-full mt-2 w-64 bg-[var(--surface)] border border-[var(--border-solid)] rounded-xl shadow-lg shadow-black/10 dark:shadow-black/40 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            {/* User Header Info */}
                            <div className="p-4 border-b border-[var(--border-solid)] bg-[var(--surface-2)]/50">
                                <p className="font-semibold text-sm text-[var(--text)] truncate">
                                    {user.name || "Manage Me User"}
                                </p>
                                <p className="text-xs text-[var(--muted)] truncate mt-0.5">
                                    {user.email || "No email available"}
                                </p>
                                {user.id && (
                                    <p className="text-[10px] text-[var(--muted)] font-mono mt-2 opacity-70">
                                        ID: {user.id}
                                    </p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="p-1.5 flex flex-col gap-0.5">
                                <button
                                    onClick={() => {
                                        setIsDropdownOpen(false);
                                        signOut({ callbackUrl: "/login" });
                                    }}
                                    className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors text-left cursor-pointer"
                                >
                                    <LogOut size={16} className="text-[var(--muted)]" />
                                    Sign Out
                                </button>
                                
                                <div className="h-px bg-[var(--border-solid)] my-1" />
                                
                                <button
                                    onClick={handleDeleteAccount}
                                    className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left cursor-pointer"
                                >
                                    <Trash2 size={16} />
                                    Delete Account
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

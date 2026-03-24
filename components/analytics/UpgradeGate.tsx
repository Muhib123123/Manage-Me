"use client";

import Link from "next/link";

interface Props {
    title: string;
    description?: string;
    href?: string;
    blurContent?: React.ReactNode;
    className?: string;
}

export function UpgradeGate({ title, description, href = "/pricing", blurContent, className }: Props) {
    return (
        <div className={`relative overflow-hidden ${className || "rounded-[24px] border border-[var(--border-solid)] bg-[var(--surface)]"}`}>
            {/* Blurred background content */}
            {blurContent && (
                <div className="blur-sm pointer-events-none select-none opacity-50" aria-hidden>
                    {blurContent}
                </div>
            )}

            {/* Lock overlay */}
            <div className={`${blurContent ? "absolute inset-0" : "p-8"} flex flex-col items-center justify-center gap-3 bg-[var(--surface)]/80 backdrop-blur-sm`}>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                        <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="text-center">
                    <p className="font-semibold text-[var(--text)] text-sm">{title}</p>
                    {description && (
                        <p className="text-xs text-[var(--muted)] mt-1 max-w-xs">{description}</p>
                    )}
                </div>
                <Link
                    href={href}
                    className="mt-1 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:opacity-90"
                >
                    Upgrade to Creator →
                </Link>
            </div>
        </div>
    );
}

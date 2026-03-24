"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { useInView } from "./useInView";

interface Props {
    subscribers: number | null;
    followers: number | null;
    views: number | null;
    platform: string;
    trend?: number | null; // delta from previous snapshot (can be positive or negative)
}

function formatNumber(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
}

function CountUp({ target, className }: { target: number; className?: string }) {
    const { ref, inView } = useInView();

    useEffect(() => {
        if (!inView || !ref.current || target === 0) return;
        const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReduced) {
            ref.current.textContent = formatNumber(target);
            return;
        }

        const obj = { val: 0 };
        gsap.to(obj, {
            val: target,
            duration: 1.8,
            ease: "power2.out",
            onUpdate() {
                if (ref.current) {
                    ref.current.textContent = formatNumber(Math.round(obj.val));
                }
            },
        });
    }, [target, inView]);

    return <span ref={ref} className={className}>0</span>;
}

export function GrowthSummaryCard({ subscribers, followers, views, platform, trend }: Props) {
    const { ref: cardRef, inView } = useInView({ threshold: 0.2 });
    const primary = subscribers ?? followers ?? 0;
    const label = platform === "YOUTUBE" ? "Subscribers" : "Followers";

    useEffect(() => {
        if (!inView || !cardRef.current) return;
        const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReduced) return;

        gsap.fromTo(
            cardRef.current.querySelectorAll(".stat-card"),
            { opacity: 0, y: 20, scale: 0.97 },
            { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.12, ease: "power2.out" }
        );
    }, [inView]);

    const trendPositive = trend !== null && trend !== undefined && trend > 0;
    const trendNegative = trend !== null && trend !== undefined && trend < 0;

    return (
        <div ref={cardRef} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Primary metric */}
            <div className="stat-card col-span-2 sm:col-span-1 p-5 rounded-2xl border border-[var(--border-solid)] shadow-sm bg-gradient-to-br from-[var(--surface)] to-[var(--surface)]/60 flex flex-col gap-1.5 transition-all hover:shadow-md">
                <p className="text-sm font-medium text-[var(--muted)]">{label} Total</p>
                <div className="flex items-end gap-2">
                    <CountUp target={primary} className="text-4xl font-semibold tracking-tight text-[var(--text)]" />
                </div>
                {trend !== null && trend !== undefined && trend !== 0 && (
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold mt-1 px-2.5 py-1 rounded-full w-fit ${trendPositive ? "bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50" : "bg-red-50 text-red-700 border border-red-100 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50"}`}>
                        <span className="text-[10px]">{trendPositive ? "↗" : "↘"}</span> {Math.abs(trend).toLocaleString()} this period
                    </span>
                )}
            </div>

            {/* Views */}
            <div className="stat-card p-5 rounded-2xl border border-[var(--border-solid)] shadow-sm bg-[var(--surface)] flex flex-col gap-1.5 transition-all hover:shadow-md">
                <p className="text-sm font-medium text-[var(--muted)]">Profile Views</p>
                <CountUp target={views ?? 0} className="text-4xl font-semibold tracking-tight text-[var(--text)]" />
                <span className="text-xs text-[var(--muted)] mt-auto pt-1">All time total</span>
            </div>

            {/* Growth indicator */}
            <div className={`stat-card p-5 rounded-2xl border shadow-sm flex flex-col gap-1.5 transition-all hover:shadow-md ${trendPositive ? "border-emerald-100/60 bg-gradient-to-br from-emerald-50/50 to-emerald-50/10 dark:border-emerald-900/30 dark:from-emerald-950/20 dark:to-transparent" : trendNegative ? "border-red-100/60 bg-gradient-to-br from-red-50/50 to-red-50/10 dark:border-red-900/30 dark:from-red-950/20 dark:to-transparent" : "border-[var(--border-solid)] bg-[var(--surface)]"}`}>
                <p className="text-sm font-medium text-[var(--muted)]">7-Day Growth</p>
                <span className={`text-4xl font-semibold tracking-tight ${trendPositive ? "text-emerald-600 dark:text-emerald-400" : trendNegative ? "text-red-600 dark:text-red-400" : "text-[var(--text)]"}`}>
                    {trend !== null && trend !== undefined
                        ? `${trendPositive ? "+" : ""}${trend.toLocaleString()}`
                        : "—"}
                </span>
                <span className="text-xs text-[var(--muted)] mt-auto pt-1">Net {label.toLowerCase()}</span>
            </div>
        </div>
    );
}

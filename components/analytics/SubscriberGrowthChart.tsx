"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useInView } from "./useInView";
import { UpgradeGate } from "./UpgradeGate";

type Range = "1d" | "7d" | "30d" | "90d";

interface Snapshot {
    snapshotAt: string;
    subscribers: number | null;
    followers: number | null;
}

interface Props {
    platform: string;
    plan: "FREE" | "CREATOR";
    initialRange?: Range;
}

const RANGES: { label: string; value: Range }[] = [
    { label: "1D", value: "1d" },
    { label: "7D", value: "7d" },
    { label: "30D", value: "30d" },
    { label: "90D", value: "90d" },
];

function formatNumber(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
}

function formatDate(iso: string, range: Range): string {
    const d = new Date(iso);
    if (range === "1d") return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function SubscriberGrowthChart({ platform, plan, initialRange = "1d" }: Props) {
    const [range, setRange] = useState<Range>(initialRange);
    const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
    const [loading, setLoading] = useState(false);
    const svgRef = useRef<SVGSVGElement>(null);
    const { ref: containerRef, inView } = useInView({ threshold: 0.2 });

    const allowedRanges: Range[] = plan === "CREATOR" ? ["1d", "7d", "30d", "90d"] : ["1d"];

    useEffect(() => {
        setLoading(true);
        fetch(`/api/analytics/${platform.toLowerCase()}/history?range=${range}`)
            .then(r => r.json())
            .then(d => {
                setSnapshots(d.snapshots ?? []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [range, platform]);

    // Animation on snapshot change
    useEffect(() => {
        if (!inView || !svgRef.current || snapshots.length === 0) return;
        const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReduced) return;

        gsap.fromTo(
            svgRef.current,
            { opacity: 0, scaleY: 0.8, transformOrigin: "bottom" },
            { opacity: 1, scaleY: 1, duration: 0.5, ease: "power2.out" }
        );
    }, [snapshots, inView]);

    const values = snapshots.map(s => s.subscribers ?? s.followers ?? 0);
    const maxVal = Math.max(...values, 1);
    const minVal = Math.min(...values, 0);
    const range_ = maxVal - minVal || 1;

    const W = 600;
    const H = 160;
    const PAD = 12;

    const points = values.map((v, i) => {
        const x = PAD + (i / Math.max(values.length - 1, 1)) * (W - PAD * 2);
        const y = H - PAD - ((v - minVal) / range_) * (H - PAD * 2);
        return `${x},${y}`;
    });

    const polyline = points.join(" ");
    const fillPath = points.length > 1
        ? `M${points[0]} L${points.join(" L")} L${points[points.length - 1].split(",")[0]},${H - PAD} L${PAD},${H - PAD} Z`
        : "";

    const delta = values.length >= 2 ? values[values.length - 1] - values[0] : null;
    const isPositive = delta !== null && delta >= 0;

    return (
        <div ref={containerRef} className="p-6 rounded-[24px] border border-[var(--border-solid)] shadow-sm bg-[var(--surface)] flex flex-col gap-6 transition-all hover:shadow-md">
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex flex-col gap-1.5">
                    <h3 className="text-sm font-medium text-[var(--muted)]">
                        {platform === "YOUTUBE" ? "Subscriber Growth" : "Follower Growth"}
                    </h3>
                    <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-semibold tracking-tight text-[var(--text)]">
                            {snapshots.length > 0 ? formatNumber(snapshots[snapshots.length - 1].subscribers ?? snapshots[snapshots.length - 1].followers ?? 0) : "—"}
                        </span>
                        {delta !== null && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isPositive ? "bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50" : "bg-red-50 text-red-700 border border-red-100 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50"}`}>
                                <span className="text-[10px] mr-0.5">{isPositive ? "↗" : "↘"}</span>
                                {Math.abs(delta).toLocaleString()}
                            </span>
                        )}
                    </div>
                </div>

                {/* Range selector */}
                <div className="flex gap-1 bg-[var(--hover)]/50 rounded-xl p-1 border border-[var(--border-solid)]/50">
                    {RANGES.map(r => {
                        const locked = !allowedRanges.includes(r.value);
                        return (
                            <button
                                key={r.value}
                                title={locked ? "Upgrade to Creator to unlock" : undefined}
                                onClick={() => !locked && setRange(r.value)}
                                className={`relative px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${range === r.value
                                    ? "bg-[var(--text)] text-[var(--surface)] shadow-md"
                                    : locked
                                        ? "text-[var(--muted)] opacity-40 cursor-not-allowed"
                                        : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--hover)]"
                                    }`}
                            >
                                {r.label}
                                {locked && (
                                    <span className="ml-0.5 text-[10px]">🔒</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Chart */}
            {loading ? (
                <div className="h-40 rounded-xl bg-[var(--hover)] animate-pulse" />
            ) : snapshots.length < 2 ? (
                <div className="h-40 flex items-center justify-center text-[var(--muted)] text-sm">
                    Not enough data yet — check back soon
                </div>
            ) : (
                <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full h-40" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id={`fill-${platform}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--brand, #6366f1)" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="var(--brand, #6366f1)" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Horizontal Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                        const y = PAD + ratio * (H - PAD * 2);
                        return (
                            <line
                                key={`grid-${i}`}
                                x1={PAD}
                                y1={y}
                                x2={W - PAD}
                                y2={y}
                                stroke="var(--border-solid)"
                                strokeWidth="1"
                                opacity="0.6"
                                strokeDasharray="4 4"
                            />
                        );
                    })}

                    {fillPath && (
                        <path d={fillPath} fill={`url(#fill-${platform})`} />
                    )}
                    <polyline
                        points={polyline}
                        fill="none"
                        stroke="var(--brand, #6366f1)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    {/* Data point dots */}
                    {points.map((p, i) => {
                        const [x, y] = p.split(",").map(Number);
                        // Only show dots if there aren't too many points, or just first/last
                        if (points.length > 30 && i !== 0 && i !== points.length - 1) return null;
                        return <circle key={i} cx={x} cy={y} r={3} fill="var(--surface)" stroke="var(--brand, #6366f1)" strokeWidth="2" className="drop-shadow-sm" />;
                    })}
                </svg>
            )}

            {/* X-axis labels */}
            {!loading && snapshots.length >= 2 && (
                <div className="flex justify-between text-[11px] font-medium text-[var(--muted)] px-1 mt-3">
                    <span>{formatDate(snapshots[0].snapshotAt, range)}</span>
                    <span className="hidden sm:inline">{formatDate(snapshots[Math.floor(snapshots.length / 2)].snapshotAt, range)}</span>
                    <span>{formatDate(snapshots[snapshots.length - 1].snapshotAt, range)}</span>
                </div>
            )}
        </div>
    );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useInView } from "./useInView";

type Range = "1d" | "7d" | "30d" | "90d";

interface Snapshot {
    snapshotAt: string;
    views: number | null;
}

interface Props {
    platform: string;
    plan: "FREE" | "CREATOR";
}

const RANGES: { label: string; value: Range }[] = [
    { label: "1D", value: "1d" },
    { label: "7D", value: "7d" },
    { label: "30D", value: "30d" },
    { label: "90D", value: "90d" },
];

function formatDate(iso: string, range: Range): string {
    const d = new Date(iso);
    if (range === "1d") return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function ProfileViewsChart({ platform, plan }: Props) {
    const [range, setRange] = useState<Range>("1d");
    const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
    const [loading, setLoading] = useState(false);
    const svgRef = useRef<SVGSVGElement>(null);
    const { ref: containerRef, inView } = useInView({ threshold: 0.2 });

    const allowedRanges: Range[] = plan === "CREATOR" ? ["1d", "7d", "30d", "90d"] : ["1d"];

    useEffect(() => {
        setLoading(true);
        fetch(`/api/analytics/${platform.toLowerCase()}/history?range=${range}`)
            .then(r => r.json())
            .then(d => { setSnapshots(d.snapshots ?? []); setLoading(false); })
            .catch(() => setLoading(false));
    }, [range, platform]);

    useEffect(() => {
        if (!inView || !svgRef.current || snapshots.length === 0) return;
        const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReduced) return;
        gsap.fromTo(svgRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" });
    }, [snapshots, inView]);

    const values = snapshots.map(s => s.views ?? 0);
    const maxVal = Math.max(...values, 1);
    const W = 600; const H = 120; const PAD = 8;
    const barW = Math.max(2, (W - PAD * 2) / Math.max(values.length, 1) - 2);

    return (
        <div ref={containerRef} className="p-6 rounded-[24px] border border-[var(--border-solid)] shadow-sm bg-[var(--surface)] flex flex-col justify-between transition-all hover:shadow-md h-full">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                <div className="flex flex-col gap-1.5">
                    <h3 className="text-sm font-medium text-[var(--muted)]">Profile Views</h3>
                    <div className="text-3xl font-semibold tracking-tight text-[var(--text)]">
                        {snapshots.length > 0 ? (snapshots[snapshots.length - 1].views ?? 0).toLocaleString() : "—"}
                    </div>
                </div>

                <div className="flex gap-1 bg-[var(--hover)]/50 rounded-xl p-1 border border-[var(--border-solid)]/50">
                    {RANGES.map(r => {
                        const locked = !allowedRanges.includes(r.value);
                        return (
                            <button
                                key={r.value}
                                onClick={() => !locked && setRange(r.value)}
                                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${range === r.value
                                    ? "bg-[var(--text)] text-[var(--surface)] shadow-md"
                                    : locked
                                        ? "text-[var(--muted)] opacity-40 cursor-not-allowed"
                                        : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--hover)]"
                                    }`}
                            >
                                {r.label}{locked ? "🔒" : ""}
                            </button>
                        );
                    })}
                </div>
            </div>

            {loading ? (
                <div className="h-32 rounded-xl bg-[var(--hover)] animate-pulse" />
            ) : values.length < 2 ? (
                <div className="h-32 flex items-center justify-center text-[var(--muted)] text-sm">
                    Not enough data yet
                </div>
            ) : (
                <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full h-32" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id={`bar-${platform}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#6366f1" />
                        </linearGradient>
                    </defs>
                    
                    {/* Horizontal Grid Lines */}
                    {[0, 0.33, 0.66, 1].map((ratio, i) => {
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

                    {values.map((v, i) => {
                        const bh = Math.max(4, ((v / maxVal) * (H - PAD * 2)));
                        const x = PAD + i * ((W - PAD * 2) / values.length);
                        const y = H - PAD - bh;
                        return (
                            <rect
                                key={i}
                                x={x}
                                y={y}
                                width={barW}
                                height={bh}
                                rx="4"
                                fill={`url(#bar-${platform})`}
                                className="drop-shadow-sm transition-all hover:opacity-100"
                                opacity="0.9"
                            />
                        );
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

"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useInView } from "./useInView";

interface Props {
    malePercent: number | null;
    femalePercent: number | null;
    otherPercent?: number | null;
}

interface ArcProps {
    cx: number;
    cy: number;
    r: number;
    startAngle: number;
    endAngle: number;
    color: string;
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
    const rad = (angle - 90) * (Math.PI / 180);
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function Arc({ cx, cy, r, startAngle, endAngle, color, inView }: ArcProps & { inView: boolean }) {
    const ref = useRef<SVGPathElement>(null);
    const start = polarToCartesian(cx, cy, r, startAngle);
    const end = polarToCartesian(cx, cy, r, endAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    const d = `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;

    useEffect(() => {
        if (!inView || !ref.current) return;
        const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReduced) return;

        const length = ref.current.getTotalLength();
        gsap.fromTo(
            ref.current,
            { strokeDasharray: length, strokeDashoffset: length, opacity: 0 },
            { strokeDashoffset: 0, opacity: 1, duration: 1, ease: "power2.out", delay: 0.2 }
        );
    }, [inView]);

    return (
        <path
            ref={ref}
            d={d}
            fill="none"
            stroke={color}
            strokeWidth="18"
            strokeLinecap="round"
        />
    );
}

export function GenderBreakdown({ malePercent, femalePercent, otherPercent }: Props) {
    const { ref: containerRef, inView } = useInView({ threshold: 0.2 });

    useEffect(() => {
        if (!inView || !containerRef.current) return;
        const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReduced) return;

        gsap.fromTo(
            containerRef.current,
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
        );
    }, [inView]);

    const hasData = malePercent !== null && femalePercent !== null;
    const other = otherPercent ?? (hasData ? Math.max(0, 100 - malePercent! - femalePercent!) : 0);

    // Build arcs
    const CX = 60;
    const CY = 60;
    const R = 44;
    let currentAngle = -90; // start from top

    const segments = hasData
        ? [
            { label: "Male", pct: malePercent!, color: "#6366f1" },
            { label: "Female", pct: femalePercent!, color: "#ec4899" },
            ...(other > 0 ? [{ label: "Other", pct: other, color: "#94a3b8" }] : []),
        ]
        : [];

    const arcs = segments.map(seg => {
        const start = currentAngle;
        const sweep = (seg.pct / 100) * 360;
        currentAngle += sweep;
        return { ...seg, startAngle: start, endAngle: currentAngle - 1 };
    });

    return (
        <div ref={containerRef} className="p-6 rounded-[24px] border border-[var(--border-solid)] shadow-sm bg-[var(--surface)] flex flex-col justify-between transition-all hover:shadow-md h-full">
            <h3 className="text-sm font-medium text-[var(--muted)] mb-6">Audience Demographics</h3>

            {!hasData ? (
                <div className="flex items-center justify-center h-32 text-[var(--muted)] text-sm italic">
                    Gender data not available
                </div>
            ) : (
                <div className="flex items-center gap-6">
                    {/* Donut */}
                    <svg width="120" height="120" viewBox="0 0 120 120">
                        {/* Background ring */}
                        <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--hover)" strokeWidth="18" />
                        {arcs.map((arc, i) => (
                            <Arc
                                key={i}
                                cx={CX}
                                cy={CY}
                                r={R}
                                startAngle={arc.startAngle}
                                endAngle={arc.endAngle}
                                color={arc.color}
                                inView={inView}
                            />
                        ))}
                    </svg>

                    {/* Legend */}
                    <div className="flex flex-col gap-3 flex-1 min-w-[120px]">
                        {arcs.map((arc, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ background: arc.color }} />
                                <span className="text-sm font-medium text-[var(--muted)]">{arc.label}</span>
                                <span className="text-sm font-semibold tracking-tight text-[var(--text)] ml-auto">{arc.pct.toFixed(1)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

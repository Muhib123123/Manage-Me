"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { UpgradeGate } from "./UpgradeGate";
import { useInView } from "./useInView";

interface Props {
    platform: string;
    plan: "FREE" | "CREATOR";
    initialCount?: number;
    label?: string;
}

function formatCount(n: number): string {
    return n.toLocaleString();
}

export function LiveSubscriberCounter({ platform, plan, initialCount = 0, label }: Props) {
    const [count, setCount] = useState(initialCount);
    const [connected, setConnected] = useState(false);
    const [hasAnimated, setHasAnimated] = useState(false);
    const countRef = useRef<HTMLDivElement>(null);
    const { ref: containerRef, inView } = useInView({ threshold: 0.2 });
    const prevCountRef = useRef(initialCount);

    useEffect(() => {
        if (plan !== "CREATOR") return;

        const es = new EventSource(`/api/analytics/${platform.toLowerCase()}/live`);

        es.onopen = () => setConnected(true);

        es.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.heartbeat) return;
            const newCount = data.count ?? 0;
            setCount(newCount);

            // Animate the number change
            if (!countRef.current) return;
            const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

            if (!prefersReduced) {
                const obj = { val: prevCountRef.current };
                gsap.to(obj, {
                    val: newCount,
                    duration: 0.8,
                    ease: "power2.out",
                    onUpdate() {
                        if (countRef.current) {
                            countRef.current.textContent = formatCount(Math.round(obj.val));
                        }
                    },
                });
            }
            prevCountRef.current = newCount;
        };

        es.onerror = () => setConnected(false);

        return () => es.close();
    }, [platform, plan]);

    // Initial scroll-in animation from 0
    useEffect(() => {
        if (!inView || !countRef.current || hasAnimated || count === 0) return;
        setHasAnimated(true);

        const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReduced) {
            countRef.current.textContent = formatCount(count);
            return;
        }

        const obj = { val: 0 };
        gsap.to(obj, {
            val: count,
            duration: 1.8,
            ease: "power2.out",
            onUpdate() {
                if (countRef.current) {
                    countRef.current.textContent = formatCount(Math.round(obj.val));
                }
            },
        });
    }, [inView, count, hasAnimated]);

    const displayLabel = label ?? (platform === "YOUTUBE" ? "Live Subscribers" : "Live Followers");

    if (plan !== "CREATOR") {
        return (
            <UpgradeGate
                className="rounded-[24px] border border-[var(--border-solid)] shadow-sm bg-[var(--surface)] hover:shadow-md h-full min-h-[160px]"
                title="Live Counter — Creator Only"
                description="See your subscriber count update in real-time as you gain new followers."
                blurContent={
                    <div className="p-6 flex flex-col justify-center items-center gap-4 h-full min-h-[160px]">
                        <div className="flex items-center gap-2 bg-[var(--hover)]/50 px-3 py-1.5 rounded-full border border-[var(--border-solid)]/50">
                            <span className="w-2 h-2 rounded-full bg-gray-400" />
                            <span className="text-[11px] font-semibold tracking-wide uppercase text-[var(--muted)]">Live</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <div className="text-6xl font-bold tracking-tighter text-[var(--text)] tabular-nums px-4">—</div>
                            <p className="text-sm font-medium text-[var(--muted)]">{displayLabel}</p>
                        </div>
                    </div>
                }
            />
        );
    }

    return (
        <div ref={containerRef} className="p-6 rounded-[24px] border border-[var(--border-solid)] shadow-sm bg-[var(--surface)] flex flex-col justify-center items-center gap-4 transition-all hover:shadow-md h-full min-h-[160px]">
            {/* Live indicator */}
            <div className="flex items-center gap-2 bg-[var(--hover)]/50 px-3 py-1.5 rounded-full border border-[var(--border-solid)]/50">
                <span
                    className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500 shadow-[0_0_8px_2px_rgba(16,185,129,0.5)]" : "bg-gray-400"}`}
                    style={connected ? { animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite" } : {}}
                />
                <span className="text-[11px] font-semibold tracking-wide uppercase text-[var(--muted)]">
                    {connected ? "Live" : "Connecting…"}
                </span>
            </div>

            {/* Big number */}
            <div className="flex flex-col items-center gap-1">
                <div
                    ref={countRef}
                    className="text-6xl font-bold tracking-tighter text-[var(--text)] tabular-nums px-4"
                >
                    {hasAnimated ? formatCount(count) : "0"}
                </div>
                <p className="text-sm font-medium text-[var(--muted)]">{displayLabel}</p>
            </div>
        </div>
    );
}

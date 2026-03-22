"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, X, Zap, Crown } from "lucide-react";
import { isEULocale } from "@/lib/subscription";
import { useSearchParams } from "next/navigation";

// ─── Plan data ─────────────────────────────────────

const FREE_FEATURES = [
    { text: "1 YouTube post / day", included: true },
    { text: "1 Instagram post / day", included: true },
    { text: "1 TikTok post / day", included: true },
    { text: "15 posts / month (all platforms)", included: true },
    { text: "Schedule up to 7 days ahead", included: true },
    { text: "15 scheduled posts at a time", included: true },
    { text: "Switch platform accounts", included: true },
    { text: "Up to 20 Instagram / TikTok posts / day", included: false },
    { text: "Schedule up to 30 days ahead", included: false },
    { text: "Unlimited monthly posts", included: false },
];

const CREATOR_FEATURES = [
    { text: "1 YouTube post / day", included: true },
    { text: "Up to 20 Instagram posts / day", included: true },
    { text: "Up to 20 TikTok posts / day", included: true },
    { text: "Unlimited posts / month", included: true },
    { text: "Schedule up to 30 days ahead", included: true },
    { text: "Unlimited scheduled posts", included: true },
    { text: "Switch platform accounts anytime", included: true },
    { text: "Priority support", included: true },
];

const COMPARISON = [
    { label: "YouTube posts / day", free: "1", creator: "1" },
    { label: "Instagram posts / day", free: "1", creator: "Up to 20" },
    { label: "TikTok posts / day", free: "1", creator: "Up to 20" },
    { label: "Posts / month", free: "15", creator: "Unlimited" },
    { label: "Schedule horizon", free: "7 days", creator: "30 days" },
    { label: "Scheduled posts", free: "15 max", creator: "Unlimited" },
    { label: "Switch platform accounts", free: true, creator: true },
];

// ─── Sub-components ────────────────────────────────

function FeatureRow({ text, included }: { text: string; included: boolean }) {
    return (
        <div className="flex items-start gap-3 py-2">
            <span
                className={`mt-0.5 shrink-0 rounded-full p-0.5 ${included
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-[var(--muted)] opacity-40"
                    }`}
            >
                {included ? <Check size={15} strokeWidth={2.5} /> : <X size={15} strokeWidth={2.5} />}
            </span>
            <span
                className={`text-sm leading-snug ${included
                    ? "text-[var(--text)]"
                    : "text-[var(--muted)] opacity-50 line-through"
                    }`}
            >
                {text}
            </span>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────

export default function PricingPage() {
    const searchParams = useSearchParams();
    const limitReason = searchParams.get("reason");

    const [isEU, setIsEU] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const locale = navigator.language || "en-US";
        setIsEU(isEULocale(locale));
        // Stagger entrance animation
        const t = setTimeout(() => setVisible(true), 50);
        return () => clearTimeout(t);
    }, []);

    const currency = isEU ? "€" : "$";
    const price = `${currency}15`;

    return (
        <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6">

            {/* Limit hit banner */}
            {limitReason === "limit" && (
                <div
                    className="mb-10 px-5 py-4 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/8 flex items-start gap-3"
                    style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(12px)", transition: "opacity 0.4s ease, transform 0.4s ease" }}
                >
                    <Zap size={18} className="text-[var(--accent)] shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-[var(--text)]">You&apos;ve reached your plan limit</p>
                        <p className="text-xs text-[var(--muted)] mt-0.5">Upgrade to Creator to keep posting without restrictions.</p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div
                className="text-center mb-14"
                style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? "none" : "translateY(20px)",
                    transition: "opacity 0.5s ease, transform 0.5s ease"
                }}
            >
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Pricing</p>
                <h1 className="font-extrabold tracking-tight text-[var(--text)] mb-4" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>
                    Simple, honest pricing
                </h1>
                <p className="text-[var(--muted)] text-base max-w-[52ch] mx-auto leading-relaxed">
                    Start for free. Upgrade when you&apos;re ready to post more.
                    No hidden fees, no contracts, cancel anytime.
                </p>
            </div>

            {/* Plan Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">

                {/* Free Card */}
                <div
                    className="rounded-xl border border-[var(--border-solid)] bg-[var(--surface)] p-7 flex flex-col"
                    style={{
                        boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)",
                        opacity: visible ? 1 : 0,
                        transform: visible ? "none" : "translateY(24px)",
                        transition: "opacity 0.5s ease 0.08s, transform 0.5s ease 0.08s"
                    }}
                >
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">Free</span>
                        </div>
                        <div className="flex items-baseline gap-1 mb-1">
                            <span className="text-4xl font-extrabold text-[var(--text)] tracking-tight">$0</span>
                            <span className="text-sm text-[var(--muted)] font-medium">/ forever</span>
                        </div>
                        <p className="text-xs text-[var(--muted)]">No credit card required.</p>
                    </div>

                    <div className="flex-1 flex flex-col divide-y divide-[var(--border)]">
                        {FREE_FEATURES.map((f) => (
                            <FeatureRow key={f.text} text={f.text} included={f.included} />
                        ))}
                    </div>

                    <div className="mt-7">
                        <div className="w-full flex items-center justify-center px-5 py-3 rounded-lg border border-[var(--border-solid)] text-sm font-semibold text-[var(--muted)] cursor-default select-none">
                            Current Plan
                        </div>
                    </div>
                </div>

                {/* Creator Card */}
                <div
                    className="rounded-xl border-2 bg-[var(--surface)] p-7 flex flex-col relative overflow-hidden"
                    style={{
                        borderColor: "var(--accent)",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(202,138,4,0.08)",
                        opacity: visible ? 1 : 0,
                        transform: visible ? "none" : "translateY(24px)",
                        transition: "opacity 0.5s ease 0.16s, transform 0.5s ease 0.16s"
                    }}
                >
                    {/* Top badge */}
                    <div className="absolute top-5 right-5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--accent)] text-white dark:text-black">
                            <Crown size={9} /> Most popular
                        </span>
                    </div>

                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Zap size={14} className="text-[var(--accent)]" />
                            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">Creator</span>
                        </div>
                        <div className="flex items-baseline gap-1 mb-1">
                            <span className="text-4xl font-extrabold text-[var(--text)] tracking-tight">{price}</span>
                            <span className="text-sm text-[var(--muted)] font-medium">/ month</span>
                        </div>
                        <p className="text-xs text-[var(--muted)]">Billed monthly. Cancel anytime.</p>
                    </div>

                    <div className="flex-1 flex flex-col divide-y divide-[var(--border)]">
                        {CREATOR_FEATURES.map((f) => (
                            <FeatureRow key={f.text} text={f.text} included={f.included} />
                        ))}
                    </div>

                    <div className="mt-7">
                        <button
                            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold cursor-pointer text-white"
                            style={{
                                background: "var(--accent)",
                                boxShadow: "0 2px 8px rgba(202,138,4,0.25)",
                            }}
                            onClick={() => alert("Payment integration coming soon!")}
                        >
                            <Zap size={15} />
                            Upgrade to Creator — {price}/mo
                        </button>
                        <p className="text-center text-[10px] text-[var(--muted)] mt-2">No contracts. Cancel anytime.</p>
                    </div>
                </div>
            </div>

            {/* Comparison Table */}
            <div
                className="rounded-xl border border-[var(--border-solid)] bg-[var(--surface)] overflow-hidden"
                style={{
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)",
                    opacity: visible ? 1 : 0,
                    transform: visible ? "none" : "translateY(24px)",
                    transition: "opacity 0.5s ease 0.24s, transform 0.5s ease 0.24s"
                }}
            >
                <div className="px-6 py-4 border-b border-[var(--border-solid)]">
                    <h2 className="text-base font-bold text-[var(--text)] tracking-tight" style={{ fontSize: "1rem" }}>Full comparison</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[var(--border-solid)]">
                                <th className="text-left px-6 py-3 text-[var(--muted)] font-semibold text-xs uppercase tracking-wider w-1/2">Feature</th>
                                <th className="text-center px-4 py-3 text-[var(--muted)] font-semibold text-xs uppercase tracking-wider w-1/4">Free</th>
                                <th className="text-center px-4 py-3 text-xs uppercase tracking-wider font-bold w-1/4" style={{ color: "var(--accent)" }}>Creator</th>
                            </tr>
                        </thead>
                        <tbody>
                            {COMPARISON.map((row, i) => (
                                <tr
                                    key={row.label}
                                    className={i % 2 === 0 ? "bg-[var(--surface)]" : "bg-[var(--surface-2)]"}
                                >
                                    <td className="px-6 py-3.5 text-[var(--text)] font-medium">{row.label}</td>
                                    <td className="px-4 py-3.5 text-center text-[var(--muted)]">
                                        {typeof row.free === "boolean"
                                            ? row.free
                                                ? <Check size={16} className="mx-auto text-emerald-500" />
                                                : <X size={16} className="mx-auto text-[var(--muted)] opacity-40" />
                                            : row.free
                                        }
                                    </td>
                                    <td className="px-4 py-3.5 text-center font-semibold text-[var(--text)]">
                                        {typeof row.creator === "boolean"
                                            ? row.creator
                                                ? <Check size={16} className="mx-auto text-emerald-500" />
                                                : <X size={16} className="mx-auto text-[var(--muted)] opacity-40" />
                                            : row.creator
                                        }
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Back link */}
            <div
                className="mt-10 text-center"
                style={{
                    opacity: visible ? 1 : 0,
                    transition: "opacity 0.5s ease 0.32s"
                }}
            >
                <Link
                    href="/dashboard"
                    className="text-xs text-[var(--muted)] hover:text-[var(--text)] no-underline"
                >
                    ← Back to dashboard
                </Link>
            </div>

        </div>
    );
}

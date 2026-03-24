import { auth } from "@/lib/auth";
import { getUserPlan } from "@/lib/subscription";
import { redirect } from "next/navigation";
import PricingClient from "./PricingClient";
import Link from "next/link";
import { CheckCircle2, Zap } from "lucide-react";

export default async function PricingPage() {
    const session = await auth();
    if (!session) {
        redirect("/login");
    }

    const plan = await getUserPlan(session.user.id);

    // Shield Creator accounts from seeing the checkout
    if (plan === "CREATOR") {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                <div className="w-20 h-20 rounded-3xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center mb-8 shadow-[0_0_32px_rgba(202,138,4,0.15)] ring-1 ring-[var(--accent)]/30">
                    <CheckCircle2 size={40} strokeWidth={2.5} />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--accent)] mb-3">Active Subscription</p>
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[var(--text)] mb-5">
                    You're a Creator
                </h1>
                <p className="text-[var(--muted)] text-base max-w-[400px] mx-auto leading-relaxed mb-10">
                    You currently have full access to Unlimited Scheduling, Advanced Analytics, and real-time Live Counters.
                </p>
                <Link href="/dashboard" className="px-8 py-3.5 bg-[var(--text)] hover:opacity-90 text-[var(--surface)] font-bold text-sm rounded-full transition-all shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] flex items-center gap-2">
                    <Zap size={16} /> Dashboard
                </Link>
            </div>
        );
    }

    return <PricingClient />;
}

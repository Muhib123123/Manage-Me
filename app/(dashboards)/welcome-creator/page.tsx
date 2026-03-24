"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Zap, Activity, CalendarDays, CheckCircle2 } from "lucide-react";
import { gsap } from "gsap";

export default function WelcomeCreatorPage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const cardsRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReduced) return;

        const tl = gsap.timeline();

        // Reveal background/container softly
        tl.fromTo(containerRef.current,
            { opacity: 0 },
            { opacity: 1, duration: 0.8, ease: "power2.out" }
        )
        // Stagger title and subtitle
        .fromTo(titleRef.current?.children || [],
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6, stagger: 0.15, ease: "back.out(1.2)" },
            "-=0.4"
        )
        // Stagger feature cards
        .fromTo(cardsRef.current?.children || [],
            { opacity: 0, scale: 0.95, y: 15 },
            { opacity: 1, scale: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" },
            "-=0.2"
        )
        // Reveal CTA
        .fromTo(buttonRef.current,
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
            "-=0.1"
        );
    }, []);

    const features = [
        {
            icon: <CalendarDays size={20} className="text-[var(--accent)]" />,
            title: "Unlimited Scheduling",
            desc: "Plan up to 30 days in advance with no monthly post limits across all platforms."
        },
        {
            icon: <Activity size={20} className="text-[var(--accent)]" />,
            title: "Advanced Analytics",
            desc: "Unlock the full historical performance of your content with interactive charts."
        },
        {
            icon: <Zap size={20} className="text-[var(--accent)]" />,
            title: "Live Subscriber Counter",
            desc: "Watch your audience grow in real-time with our live Server-Sent Events stream."
        }
    ];

    return (
        <div ref={containerRef} className="min-h-[80vh] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--accent)]/5 rounded-full blur-[100px] -z-10 pointer-events-none" />
            
            <div className="max-w-3xl w-full flex flex-col items-center">
                
                {/* Header */}
                <div ref={titleRef} className="text-center mb-16 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center mb-6 shadow-[0_0_24px_rgba(202,138,4,0.2)]">
                        <CheckCircle2 size={32} strokeWidth={2.5} />
                    </div>
                    <p className="text-sm font-bold uppercase tracking-widest text-[var(--accent)] mb-3">Upgrade Successful</p>
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[var(--text)] mb-4">
                        Welcome to Creator
                    </h1>
                    <p className="text-[var(--muted)] text-base max-w-lg leading-relaxed">
                        Your account has been successfully upgraded. You now have access to our most powerful tools to grow your audience.
                    </p>
                </div>

                {/* Features Grid */}
                <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-16">
                    {features.map((f, i) => (
                        <div key={i} className="p-6 rounded-[24px] border border-[var(--border-solid)] bg-[var(--surface)] shadow-sm flex flex-col gap-3 transition-all hover:shadow-md hover:border-[var(--accent)]/30">
                            <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center mb-2">
                                {f.icon}
                            </div>
                            <h3 className="text-base font-bold text-[var(--text)]">{f.title}</h3>
                            <p className="text-sm text-[var(--muted)] leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div ref={buttonRef} className="flex flex-col items-center gap-4">
                    <Link href="/dashboard" className="px-8 py-3.5 bg-[var(--text)] hover:bg-[var(--text)]/90 text-[var(--surface)] font-bold text-sm rounded-full transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                        Get Started
                    </Link>
                </div>

            </div>
        </div>
    );
}

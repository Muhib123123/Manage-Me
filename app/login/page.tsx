"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Image from "next/image";

export default function LoginPage() {
    const [loading, setLoading] = useState(false);

    const handleGoogleSignIn = async () => {
        setLoading(true);
        await signIn("google", { callbackUrl: "/dashboard" });
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-[var(--bg)]">

            {/* Minimal Background Element */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
                <div
                    className="absolute w-[800px] h-[800px] rounded-full -top-[200px] -right-[200px] blur-3xl opacity-20"
                    style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 60%)" }}
                />
            </div>

            {/* Premium Card */}
            <div className="w-full max-w-[400px] bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-10 py-12 relative z-[1] shadow-sm">

                {/* Logo mark */}
                <div className="text-center mb-10">
                    <div className="w-24 h-24 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm">
                        <Image src="/logo.png" alt="Logo" width={100} height={100} />
                    </div>

                    <div className="font-semibold mb-4 text-4xl lg:text-5xl">
                        <span className="text-[var(--manage)]">Manage</span> <span className="text-[var(--me)]">Me</span>
                    </div>

                    <p className="text-[var(--muted)] text-base leading-relaxed max-w-[280px] mx-auto">
                        Your unified studio to schedule posts across YouTube, Instagram, and TikTok.
                    </p>
                </div>

                {/* Sign in button */}
                <button
                    className="btn-google h-12 w-full text-[15px] hover:bg-[var(--surface-2)]"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    style={{ opacity: loading ? 0.7 : 1 }}
                >
                    {loading ? <LoadingSpinner /> : <GoogleIcon />}
                    {loading ? "Connecting…" : "Continue with Google"}
                </button>

                {/* Feature pills (Restrained) */}
                <div className="flex gap-2 justify-center flex-wrap mt-10">
                    {["YouTube", "Instagram", "TikTok"].map((f) => (
                        <span
                            key={f}
                            className="px-3 py-1 rounded-full bg-[var(--bg)] border border-[var(--border)] text-[11px] uppercase tracking-wider text-[var(--muted)] font-medium"
                        >
                            {f}
                        </span>
                    ))}
                </div>
            </div>

            {/* Minimal Footer */}
            <p className="mt-8 text-[11px] text-[var(--muted)] tracking-wide uppercase text-center relative z-[1]">
                A Modern Social Publishing Hub
            </p>
        </main>
    );
}

function GoogleIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
            <path
                d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
                fill="#FFC107"
            />
            <path
                d="M6.306 14.691l6.571 4.819C14.655 15.108 19.001 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
                fill="#FF3D00"
            />
            <path
                d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
                fill="#4CAF50"
            />
            <path
                d="M43.611 20.083H42V20H24v8h11.303a11.966 11.966 0 01-4.087 5.571l6.19 5.238C42.021 35.544 44 30.034 44 24c0-1.341-.138-2.65-.389-3.917z"
                fill="#1976D2"
            />
        </svg>
    );
}

function LoadingSpinner() {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ animation: "spin 1s linear infinite" }}
        >
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 0110 10" strokeLinecap="round" />
        </svg>
    );
}

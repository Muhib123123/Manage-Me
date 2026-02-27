"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
    const [loading, setLoading] = useState(false);

    const handleGoogleSignIn = async () => {
        setLoading(true);
        await signIn("google", { callbackUrl: "/dashboard" });
    };

    return (
        <main
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Background blobs */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        width: "600px",
                        height: "600px",
                        borderRadius: "50%",
                        background:
                            "radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)",
                        top: "-100px",
                        left: "-100px",
                        animation: "float 6s ease-in-out infinite",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        width: "500px",
                        height: "500px",
                        borderRadius: "50%",
                        background:
                            "radial-gradient(circle, rgba(108,99,255,0.10) 0%, transparent 70%)",
                        bottom: "-80px",
                        right: "-80px",
                        animation: "float 8s ease-in-out infinite reverse",
                    }}
                />
            </div>

            {/* Card */}
            <div
                className="glass animate-fade-up"
                style={{
                    width: "100%",
                    maxWidth: "420px",
                    borderRadius: "24px",
                    padding: "48px 40px",
                    position: "relative",
                    zIndex: 1,
                }}
            >
                {/* Logo mark */}
                <div style={{ textAlign: "center", marginBottom: "36px" }}>
                    <div
                        style={{
                            width: "64px",
                            height: "64px",
                            borderRadius: "18px",
                            background: "linear-gradient(135deg, #ff3b5c, #6c63ff)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 20px",
                            fontSize: "28px",
                            boxShadow: "0 8px 32px var(--primary-glow)",
                            animation: "pulse-glow 3s ease-in-out infinite",
                        }}
                    >
                        🎬
                    </div>

                    <h1
                        style={{
                            fontSize: "28px",
                            fontWeight: 800,
                            letterSpacing: "-0.5px",
                            marginBottom: "8px",
                        }}
                    >
                        <span className="gradient-text">Manage Me</span>
                    </h1>

                    <p
                        style={{
                            color: "var(--muted)",
                            fontSize: "14px",
                            lineHeight: 1.6,
                        }}
                    >
                        Schedule YouTube videos & Shorts to publish
                        <br />
                        automatically at the perfect time.
                    </p>
                </div>

                {/* Divider */}
                <div
                    style={{
                        height: "1px",
                        background: "var(--border)",
                        marginBottom: "28px",
                    }}
                />

                {/* Sign in button */}
                <button
                    className="btn-google"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    style={{ opacity: loading ? 0.7 : 1 }}
                >
                    {loading ? (
                        <LoadingSpinner />
                    ) : (
                        <GoogleIcon />
                    )}
                    {loading ? "Connecting…" : "Continue with Google"}
                </button>

                {/* Info note */}
                <p
                    style={{
                        marginTop: "20px",
                        color: "var(--muted)",
                        fontSize: "12px",
                        textAlign: "center",
                        lineHeight: 1.7,
                    }}
                >
                    We'll ask permission to upload videos to your
                    <br />
                    YouTube channel on your behalf.
                </p>

                {/* Feature pills */}
                <div
                    style={{
                        display: "flex",
                        gap: "8px",
                        justifyContent: "center",
                        flexWrap: "wrap",
                        marginTop: "28px",
                    }}
                >
                    {[
                        "📹 Normal Videos",
                        "🩳 Shorts",
                        "📅 Scheduled Uploads",
                    ].map((f) => (
                        <span
                            key={f}
                            style={{
                                padding: "5px 12px",
                                borderRadius: "100px",
                                background: "var(--surface-2)",
                                border: "1px solid var(--border)",
                                fontSize: "11px",
                                color: "var(--muted)",
                                fontWeight: 500,
                            }}
                        >
                            {f}
                        </span>
                    ))}
                </div>
            </div>
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

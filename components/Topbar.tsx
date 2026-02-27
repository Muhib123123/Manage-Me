"use client";

import { signOut } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";

interface TopbarProps {
    user: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
}

export default function Topbar({ user }: TopbarProps) {
    return (
        <header
            style={{
                height: "64px",
                background: "var(--surface)",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 32px",
                flexShrink: 0,
            }}
        >
            <p style={{ color: "var(--muted)", fontSize: "14px" }}>
                Welcome back,{" "}
                <span style={{ color: "var(--text)", fontWeight: 600 }}>
                    {user.name?.split(" ")[0] ?? "Creator"}
                </span>{" "}
                👋
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <ThemeToggle />

                {/* Avatar */}
                {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={user.image}
                        alt={user.name ?? "User"}
                        width={36}
                        height={36}
                        style={{ borderRadius: "50%", border: "2px solid var(--border)" }}
                    />
                ) : (
                    <div
                        style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #ff3b5c, #6c63ff)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "14px",
                            fontWeight: 700,
                        }}
                    >
                        {user.name?.[0] ?? "U"}
                    </div>
                )}

                {/* Sign out */}
                <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        border: "1px solid var(--border)",
                        background: "transparent",
                        color: "var(--muted)",
                        fontSize: "13px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                        (e.target as HTMLButtonElement).style.color = "var(--text)";
                        (e.target as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.2)";
                    }}
                    onMouseLeave={(e) => {
                        (e.target as HTMLButtonElement).style.color = "var(--muted)";
                        (e.target as HTMLButtonElement).style.borderColor = "var(--border)";
                    }}
                >
                    Sign out
                </button>
            </div>
        </header>
    );
}

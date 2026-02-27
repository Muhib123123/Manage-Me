"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/upload", label: "Schedule Video", icon: "➕" },
];

export default function Sidebar() {
    const path = usePathname();

    return (
        <aside
            style={{
                width: "240px",
                minHeight: "100vh",
                background: "var(--surface)",
                borderRight: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                padding: "24px 16px",
                flexShrink: 0,
            }}
        >
            {/* Logo */}
            <div style={{ marginBottom: "36px", paddingLeft: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                        style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "10px",
                            background: "linear-gradient(135deg, #ff3b5c, #6c63ff)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "18px",
                            flexShrink: 0,
                        }}
                    >
                        🎬
                    </div>
                    <span
                        style={{
                            fontWeight: 800,
                            fontSize: "17px",
                            background: "linear-gradient(135deg, #ff3b5c, #6c63ff)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }}
                    >
                        Manage Me
                    </span>
                </div>
            </div>

            {/* Nav links */}
            <nav style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
                {nav.map(({ href, label, icon }) => {
                    const active = path === href;
                    return (
                        <Link
                            key={href}
                            href={href}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "10px 12px",
                                borderRadius: "10px",
                                fontWeight: 500,
                                fontSize: "14px",
                                textDecoration: "none",
                                color: active ? "#fff" : "var(--muted)",
                                background: active
                                    ? "var(--primary-glow)"
                                    : "transparent",
                                border: active ? "1px solid var(--primary)" : "1px solid transparent",
                                transition: "all 0.2s ease",
                            }}
                        >
                            <span>{icon}</span>
                            {label}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div
                style={{
                    fontSize: "11px",
                    color: "var(--muted)",
                    paddingLeft: "8px",
                    lineHeight: 1.6,
                }}
            >
                Manage Me
                <br />
                YouTube Scheduler
            </div>
        </aside>
    );
}

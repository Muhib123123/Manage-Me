"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

interface Props {
    user: { name?: string | null; email?: string | null; image?: string | null };
    connections: string[];
    children: React.ReactNode;
}

export default function DashboardShell({ user, connections, children }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLg, setIsLg] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia("(min-width: 1024px)");
        setIsLg(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsLg(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);

    return (
        <div className="flex h-screen bg-[var(--bg)]">

            {/* Mobile overlay */}
            {!isLg && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                    style={{
                        opacity: sidebarOpen ? 1 : 0,
                        pointerEvents: sidebarOpen ? "auto" : "none",
                        transition: "opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                />
            )}

            {/* Sidebar */}
            <div
                className={isLg ? "relative z-auto shrink-0" : "fixed inset-y-0 left-0 z-50"}
                style={isLg ? {} : {
                    transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
                    transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
            >
                <Sidebar onClose={() => setSidebarOpen(false)} connections={connections} />
            </div>

            {/* Main area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Topbar user={user} onMenuClick={() => setSidebarOpen((o) => !o)} />
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>

        </div>
    );
}

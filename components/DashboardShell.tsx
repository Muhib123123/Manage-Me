"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

interface Props {
    user: { name?: string | null; email?: string | null; image?: string | null };
    children: React.ReactNode;
}

export default function DashboardShell({ user, children }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-[var(--bg)]">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar — fixed drawer on mobile, static on lg */}
            <div
                className={[
                    "fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out",
                    "lg:static lg:translate-x-0 lg:z-auto lg:block",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full",
                ].join(" ")}
            >
                <Sidebar onClose={() => setSidebarOpen(false)} />
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

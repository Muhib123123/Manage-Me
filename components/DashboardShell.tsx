"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

interface Props {
    user: { name?: string | null; email?: string | null; image?: string | null };
    connections: string[];
    plan: string;
    children: React.ReactNode;
}

export default function DashboardShell({ user, connections, plan, children }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-[var(--bg)] overflow-hidden">

            {/* Mobile overlay */}
            <div
                onClick={() => setSidebarOpen(false)}
                className={`fixed inset-0 z-40 bg-black/40 lg:hidden transition-opacity duration-300 ${sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                    }`}
            />

            {/* Sidebar Container */}
            <div
                className={`
                    fixed inset-y-0 left-0 z-50 transform lg:static lg:translate-x-0 lg:z-auto lg:shrink-0
                    ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                `}
            >
                <Sidebar onClose={() => setSidebarOpen(false)} connections={connections} plan={plan} />
            </div>

            {/* Main area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Topbar user={user} plan={plan} onMenuClick={() => setSidebarOpen((o) => !o)} />
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>

        </div>
    );
}

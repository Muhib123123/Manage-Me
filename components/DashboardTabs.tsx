"use client";

import { useState } from "react";
import { LayoutDashboard, BarChart3 } from "lucide-react";

export function DashboardTabs({
    scheduleContent,
    analyticsContent,
}: {
    scheduleContent: React.ReactNode;
    analyticsContent: React.ReactNode;
}) {
    const [tab, setTab] = useState<"schedule" | "analytics">("schedule");

    return (
        <div>
            {/* Tab Navigation */}
            <div className="flex gap-6 mb-8 border-b border-[var(--border-solid)] px-1">
                <button
                    onClick={() => setTab("schedule")}
                    className={`pb-3 border-b-2 transition-all flex items-center gap-2 font-semibold text-sm ${
                        tab === "schedule"
                            ? "border-[var(--text)] text-[var(--text)]"
                            : "border-transparent text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--border-solid)]"
                    }`}
                >
                    <LayoutDashboard size={16} />
                    Schedule
                </button>
                <button
                    onClick={() => setTab("analytics")}
                    className={`pb-3 border-b-2 transition-all flex items-center gap-2 font-semibold text-sm ${
                        tab === "analytics"
                            ? "border-[var(--text)] text-[var(--text)]"
                            : "border-transparent text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--border-solid)]"
                    }`}
                >
                    <BarChart3 size={16} />
                    Analytics
                </button>
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {tab === "schedule" ? scheduleContent : analyticsContent}
            </div>
        </div>
    );
}

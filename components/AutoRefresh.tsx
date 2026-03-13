"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface AutoRefreshProps {
    /**
     * If true, the page will refresh periodically.
     * Usually set when there are background tasks (UPLOADING/PENDING) active.
     */
    enabled?: boolean;
    /**
     * Interval in seconds. Defaults to 10s.
     */
    interval?: number;
}

/**
 * A lightweight client component that triggers a router.refresh() 
 * periodically. This allows the Server Component (Dashboard) 
 * to re-fetch data and update the UI without a full page reload.
 */
export function AutoRefresh({ enabled = true, interval = 10 }: AutoRefreshProps) {
    const router = useRouter();

    useEffect(() => {
        if (!enabled) return;

        const timer = setInterval(() => {
            router.refresh();
        }, interval * 1000);

        return () => clearInterval(timer);
    }, [enabled, interval, router]);

    return null; // This component has no UI
}

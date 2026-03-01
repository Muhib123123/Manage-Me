"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { UploadProvider } from "@/contexts/UploadContext";

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <ThemeProvider
                attribute="class"
                defaultTheme="light"
                storageKey="manage-me-theme"
            >
                <UploadProvider>
                    {children}
                </UploadProvider>
            </ThemeProvider>
        </SessionProvider>
    );
}

"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { UploadProvider } from "@/contexts/UploadContext";
import { ConfirmProvider } from "@/components/ConfirmDialog";

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                storageKey="manage-me-theme"
            >
                <UploadProvider>
                    <ConfirmProvider>
                        {children}
                    </ConfirmProvider>
                </UploadProvider>
            </ThemeProvider>
        </SessionProvider>
    );
}

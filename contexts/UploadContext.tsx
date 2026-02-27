"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

interface UploadContextType {
    isUploading: boolean;
    setIsUploading: (v: boolean) => void;
}

const UploadContext = createContext<UploadContextType>({
    isUploading: false,
    setIsUploading: () => { },
});

export function UploadProvider({ children }: { children: React.ReactNode }) {
    const [isUploading, setIsUploading] = useState(false);

    // Block browser close / refresh / external navigation while uploading
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isUploading) {
                e.preventDefault();
                e.returnValue = ""; // Triggers the native browser dialog
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isUploading]);

    return (
        <UploadContext.Provider value={{ isUploading, setIsUploading }}>
            {children}
        </UploadContext.Provider>
    );
}

export function useUpload() {
    return useContext(UploadContext);
}

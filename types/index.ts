export type UnifiedPost = {
    id: string;
    platform: "YOUTUBE" | "INSTAGRAM" | "TIKTOK";
    title: string;
    mediaType: string;
    status: string;
    scheduledAt: Date;
    storageUrl: string; // The primary URL (for video or single photo)
    mediaUrls?: string[]; // Array of URLs for carousels
    thumbnailUrl: string | null;
    errorMessage: string | null;
    platformId: string | null;
    privacy?: string;
};

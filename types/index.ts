export type UnifiedPost = {
    id: string;
    platform: "YOUTUBE" | "INSTAGRAM";
    title: string;
    mediaType: string;
    status: string;
    scheduledAt: Date;
    storageUrl: string;
    thumbnailUrl: string | null;
    errorMessage: string | null;
    platformId: string | null;
    privacy?: string;
};

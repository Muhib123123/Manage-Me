"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UnifiedPost } from "@/types";
import { useConfirm } from "@/components/ConfirmDialog";

const STATUS_META: Record<string, { label: string; color: string; border: string; bg: string }> = {
    PENDING: { label: "Pending", color: "#b45309", border: "#fde68a", bg: "#fffbeb" },
    UPLOADING: { label: "Uploading", color: "#1d4ed8", border: "#bfdbfe", bg: "#eff6ff" },
    DONE: { label: "Done", color: "#15803d", border: "#bbf7d0", bg: "#f0fdf4" },
    FAILED: { label: "Failed", color: "#b91c1c", border: "#fecaca", bg: "#fef2f2" },
};

const STATUS_LEFT: Record<string, string> = {
    PENDING: "border-l-amber-400",
    UPLOADING: "border-l-blue-500",
    DONE: "border-l-green-500",
    FAILED: "border-l-red-500",
};

export function VideoRow({ post, showError }: { post: UnifiedPost; showError?: boolean }) {
    const router = useRouter();
    const confirm = useConfirm();
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const [videoError, setVideoError] = useState(false);

    const meta = STATUS_META[post.status] ?? STATUS_META.PENDING;
    const leftBorder = STATUS_LEFT[post.status] ?? "border-l-slate-300";

    const handleUploadNow = async () => {
        const platformName = post.platform === "YOUTUBE" ? "YouTube" : post.platform === "TIKTOK" ? "TikTok" : "Instagram";
        const confirmed = await confirm({
            title: "Upload Now?",
            message: `Are you sure you want to trigger an immediate upload to ${platformName} for "${post.title}"?`,
            confirmLabel: `Yes, upload to ${platformName}`,
            cancelLabel: "Cancel",
            variant: "info",
        });
        if (!confirmed) return;

        setUploading(true);
        setUploadError("");
        try {
            const apiRoute = post.platform === "YOUTUBE"
                ? `/api/videos/${post.id}/upload`
                : post.platform === "TIKTOK"
                    ? `/api/tiktok/${post.id}/upload`
                    : `/api/instagram/${post.id}/upload`;

            const res = await fetch(apiRoute, { method: "POST" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Upload failed");
            router.refresh();
        } catch (err: unknown) {
            setUploadError(err instanceof Error ? err.message : "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async () => {
        const confirmed = await confirm({
            title: "Delete Post?",
            message: `Are you sure you want to cancel and delete "${post.title}"? This action cannot be undone.`,
            confirmLabel: "Yes, delete",
            cancelLabel: "Cancel",
            variant: "danger",
        });
        if (!confirmed) return;

        setDeleting(true);
        try {
            const apiRoute = post.platform === "YOUTUBE" ? "/api/videos"
                : post.platform === "TIKTOK" ? "/api/tiktok/posts"
                    : "/api/instagram/posts";
            await fetch(`${apiRoute}?id=${post.id}`, { method: "DELETE" });
            router.refresh();
        } finally {
            setDeleting(false);
        }
    };

    const liveUrl = post.platform === "YOUTUBE"
        ? (post.platformId ? `https://www.youtube.com/watch?v=${post.platformId}` : null)
        : post.platform === "TIKTOK"
            ? (post.platformId ? `https://www.tiktok.com/@me/video/${post.platformId}` : null)
            : (post.platformId ? `https://www.instagram.com/p/${post.platformId}` : null);

    return (
        <div
            className={[
                "flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-[var(--surface)] rounded-xl border border-[var(--border-solid)]",
                "border-l-[3px]", leftBorder,
                "shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]",
            ].join(" ")}
        >
            <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Thumbnail / Video preview */}
                <div className="w-[88px] h-[56px] rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 relative">
                    {post.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={post.thumbnailUrl}
                            alt={post.title}
                            className="w-full h-full object-cover"
                        />
                    ) : !videoError && post.mediaType !== "PHOTO" ? (
                        <video
                            src={post.storageUrl}
                            preload="metadata"
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                            onError={() => setVideoError(true)}
                        />
                    ) : post.mediaType === "PHOTO" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={post.storageUrl}
                            alt={post.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                            {post.platform === "INSTAGRAM"
                                ? "📸"
                                : (post.mediaType === "short" ? "🩳" : "📹")}
                        </div>
                    )}

                    <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] font-bold px-1 py-0.5 rounded flex items-center gap-1">
                        <span>{post.platform === "YOUTUBE" ? "YT" : post.platform === "TIKTOK" ? "TT" : "IG"}</span>
                        <span className="opacity-50">|</span>
                        <span>
                            {post.platform === "INSTAGRAM"
                                ? post.mediaType
                                : post.platform === "TIKTOK"
                                    ? "VIDEO"
                                    : (post.mediaType === "short" ? "SHORT" : "VIDEO")}
                        </span>
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[var(--text)] truncate mb-0.5">
                        {post.title}
                    </p>
                    <p className="text-[var(--muted)] text-[11px] sm:text-xs">
                        {post.privacy && `${post.privacy} · `}
                        {post.status === "DONE"
                            ? `Published ${new Date(post.scheduledAt).toLocaleDateString()}`
                            : `Scheduled: ${new Date(post.scheduledAt).toLocaleString()}`}
                    </p>
                </div>
            </div>

            {(showError && post.errorMessage) || uploadError ? (
                <div className="w-full text-red-600 text-[11px] sm:text-xs mt-1 px-1 flex items-center justify-center">
                    ⚠ {uploadError || post.errorMessage}
                </div>
            ) : null}

            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 mt-1 sm:mt-0">
                <span
                    className="px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold shrink-0 border"
                    style={{ background: meta.bg, color: meta.color, borderColor: meta.border }}
                >
                    {uploading ? "Uploading…" : meta.label}
                </span>

                <div className="flex gap-2 shrink-0">
                    {liveUrl && (
                        <a
                            href={liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`px-3 py-1.5 rounded-lg text-white text-[11px] sm:text-xs font-semibold no-underline ${post.platform === "YOUTUBE" ? "bg-red-600 hover:bg-red-700" : "bg-fuchsia-600 hover:bg-fuchsia-700"
                                }`}
                        >
                            ▶ View
                        </a>
                    )}
                    {(post.status === "PENDING" || post.status === "FAILED") && !uploading && (
                        <button
                            onClick={handleUploadNow}
                            className="px-3 py-1.5 rounded-lg bg-[var(--text)] text-[var(--surface)] text-[11px] sm:text-xs font-semibold hover:opacity-90 cursor-pointer"
                        >
                            {post.status === "FAILED" ? "Upload again" : "Upload now"}
                        </button>
                    )}
                    {post.status !== "DONE" && post.status !== "UPLOADING" && (
                        <button
                            onClick={handleDelete}
                            disabled={deleting || uploading}
                            className="px-3 py-1.5 rounded-lg border border-[var(--border-solid)] bg-transparent text-[var(--muted)] text-[11px] sm:text-xs font-medium cursor-pointer hover:text-red-600 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[32px]"
                        >
                            {deleting ? (
                                <svg className="animate-spin h-3 w-3 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : "✕"}
                        </button>
                    )}
                </div>
            </div>

        </div>
    );
}

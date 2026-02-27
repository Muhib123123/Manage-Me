"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Video = {
    id: string;
    title: string;
    videoType: string;
    status: string;
    scheduledAt: Date;
    youtubeUrl: string | null;
    errorMessage: string | null;
    privacy: string;
    storageUrl: string;
    thumbnailUrl: string | null;
};

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

export function VideoRow({ video, showError }: { video: Video; showError?: boolean }) {
    const router = useRouter();
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const [videoError, setVideoError] = useState(false);

    const meta = STATUS_META[video.status] ?? STATUS_META.PENDING;
    const leftBorder = STATUS_LEFT[video.status] ?? "border-l-slate-300";

    const handleUploadNow = async () => {
        if (!confirm(`Upload "${video.title}" to YouTube now?`)) return;
        setUploading(true);
        setUploadError("");
        try {
            const res = await fetch(`/api/videos/${video.id}/upload`, { method: "POST" });
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
        if (!confirm(`Cancel and delete "${video.title}"?`)) return;
        await fetch(`/api/videos?id=${video.id}`, { method: "DELETE" });
        router.refresh();
    };

    return (
        <div
            className={[
                "flex items-center gap-4 p-4 bg-[var(--surface)] rounded-xl border border-[var(--border-solid)]",
                "border-l-[3px]", leftBorder,
                "shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]",
            ].join(" ")}
        >
            {/* Thumbnail / Video preview */}
            <div className="w-[88px] h-[56px] rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 relative">
                {video.thumbnailUrl ? (
                    // Show uploaded thumbnail image
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover"
                    />
                ) : !videoError ? (
                    // Show first frame of video using <video preload="metadata">
                    <video
                        src={video.storageUrl}
                        preload="metadata"
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                        onError={() => setVideoError(true)}
                    />
                ) : (
                    // Fallback icon
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                        {video.videoType === "short" ? "🩳" : "📹"}
                    </div>
                )}

                {/* Video type badge overlay */}
                <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] font-bold px-1 py-0.5 rounded">
                    {video.videoType === "short" ? "SHORT" : "VIDEO"}
                </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-[var(--text)] truncate mb-0.5">
                    {video.title}
                </p>
                <p className="text-[var(--muted)] text-xs">
                    {video.privacy} ·{" "}
                    {video.status === "DONE"
                        ? `Published ${new Date(video.scheduledAt).toLocaleDateString()}`
                        : `Scheduled: ${new Date(video.scheduledAt).toLocaleString()}`}
                </p>
                {showError && video.errorMessage && (
                    <p className="text-red-600 text-xs mt-1">⚠ {video.errorMessage}</p>
                )}
                {uploadError && (
                    <p className="text-red-600 text-xs mt-1">⚠ {uploadError}</p>
                )}
            </div>

            {/* Status badge */}
            <span
                className="px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 border"
                style={{ background: meta.bg, color: meta.color, borderColor: meta.border }}
            >
                {uploading ? "Uploading…" : meta.label}
            </span>

            {/* Actions */}
            <div className="flex gap-2 shrink-0">
                {video.youtubeUrl && (
                    <a
                        href={video.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold no-underline hover:bg-red-700 transition-colors"
                    >
                        ▶ View
                    </a>
                )}
                {(video.status === "PENDING" || video.status === "FAILED") && !uploading && (
                    <button
                        onClick={handleUploadNow}
                        className="btn-primary px-3 py-1.5 text-xs"
                    >
                        ⬆ Upload Now
                    </button>
                )}
                {video.status !== "DONE" && video.status !== "UPLOADING" && (
                    <button
                        onClick={handleDelete}
                        className="px-3 py-1.5 rounded-lg border border-[var(--border-solid)] bg-transparent text-[var(--muted)] text-xs font-medium cursor-pointer transition-all hover:text-red-600 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                        ✕ Cancel
                    </button>
                )}
            </div>
        </div>
    );
}

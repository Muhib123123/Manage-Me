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
};

const STATUS_COLORS: Record<string, string> = {
    PENDING: "#f5a623",
    UPLOADING: "#6c63ff",
    DONE: "#22c55e",
    FAILED: "#ff3b5c",
};

export function VideoRow({ video, showError }: { video: Video; showError?: boolean }) {
    const router = useRouter();
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");

    const color = STATUS_COLORS[video.status] ?? "var(--muted)";

    const handleUploadNow = async () => {
        if (!confirm(`Upload "${video.title}" to YouTube now?`)) return;
        setUploading(true);
        setUploadError("");

        try {
            const res = await fetch(`/api/videos/${video.id}/upload`, { method: "POST" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Upload failed");
            router.refresh(); // Refresh dashboard to show new DONE status
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
            style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: "16px 20px",
                borderRadius: "12px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                transition: "border-color 0.2s",
            }}
        >
            {/* Type icon */}
            <div
                style={{
                    width: "40px", height: "40px", borderRadius: "10px",
                    background: "var(--surface-2)", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    fontSize: "18px", flexShrink: 0,
                }}
            >
                {video.videoType === "short" ? "🩳" : "📹"}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                    fontWeight: 600, fontSize: "14px", marginBottom: "4px",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                }}>
                    {video.title}
                </p>
                <p style={{ color: "var(--muted)", fontSize: "12px" }}>
                    {video.videoType === "short" ? "YouTube Short" : "Normal Video"} · {video.privacy} ·{" "}
                    {video.status === "DONE"
                        ? `Published ${new Date(video.scheduledAt).toLocaleDateString()}`
                        : `Scheduled: ${new Date(video.scheduledAt).toLocaleString()}`}
                </p>
                {showError && video.errorMessage && (
                    <p style={{ color: "#ff3b5c", fontSize: "12px", marginTop: "4px" }}>
                        ⚠ {video.errorMessage}
                    </p>
                )}
                {uploadError && (
                    <p style={{ color: "#ff3b5c", fontSize: "12px", marginTop: "4px" }}>
                        ⚠ {uploadError}
                    </p>
                )}
            </div>

            {/* Status badge */}
            <span style={{
                padding: "4px 12px", borderRadius: "100px", fontSize: "11px",
                fontWeight: 700, letterSpacing: "0.5px",
                background: `${color}22`, color,
                border: `1px solid ${color}44`, flexShrink: 0,
            }}>
                {uploading ? "UPLOADING…" : video.status}
            </span>

            {/* Actions */}
            <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                {/* YouTube link for published videos */}
                {video.youtubeUrl && (
                    <a href={video.youtubeUrl} target="_blank" rel="noopener noreferrer"
                        style={{
                            padding: "6px 14px", borderRadius: "8px", background: "#ff0000",
                            color: "#fff", fontSize: "12px", fontWeight: 600, textDecoration: "none"
                        }}>
                        ▶ View
                    </a>
                )}

                {/* Manual upload trigger (PENDING or FAILED) */}
                {(video.status === "PENDING" || video.status === "FAILED") && !uploading && (
                    <button onClick={handleUploadNow}
                        className="btn-primary"
                        style={{ padding: "8px 16px", fontSize: "12px", borderRadius: "10px" }}>
                        ⬆ Upload Now
                    </button>
                )}

                {/* Delete / Cancel for non-done videos */}
                {video.status !== "DONE" && video.status !== "UPLOADING" && (
                    <button onClick={handleDelete}
                        style={{
                            padding: "8px 16px", borderRadius: "10px",
                            border: "1px solid var(--border)", background: "var(--surface)",
                            color: "var(--muted)", fontSize: "12px", cursor: "pointer", fontWeight: 600,
                            transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.borderColor = "var(--text)"; e.currentTarget.style.background = "var(--surface-2)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--surface)"; }}
                    >
                        ✕ Cancel
                    </button>
                )}
            </div>
        </div>
    );
}

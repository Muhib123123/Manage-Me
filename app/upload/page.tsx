"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { UploadDropzone } from "@/lib/uploadthing";
import { useUpload } from "@/contexts/UploadContext";

type UploadStatus = "idle" | "saving" | "done" | "error";

/* ─── Helpers ─────────────────────────────────────── */
function formatSize(bytes: number) {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const inputCls =
    "w-full px-4 py-3 rounded-xl border border-[var(--border-solid)] bg-[var(--surface)] " +
    "text-[var(--text)] text-sm outline-none transition-all duration-150 " +
    "focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 " +
    "placeholder:text-[var(--muted)]";

/* ─── Sub-component: progress + preview card ─────── */
function UploadedMediaCard({
    kind,
    url,
    fileName,
    fileSize,
    progress,
    previewFrame,
    onRemove,
    videoRef,
    onVideoLoaded,
}: {
    kind: "video" | "image";
    url: string;
    fileName: string;
    fileSize: number;
    progress: number;
    previewFrame?: string;
    onRemove: () => void;
    videoRef?: React.RefObject<HTMLVideoElement | null>;
    onVideoLoaded?: () => void;
}) {
    return (
        <div className="rounded-2xl overflow-hidden border border-[var(--border-solid)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
            {/* Preview */}
            <div className="relative aspect-video bg-slate-900">
                {kind === "video" ? (
                    previewFrame ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={previewFrame} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                        <video
                            ref={videoRef}
                            src={url}
                            preload="metadata"
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                            onLoadedMetadata={onVideoLoaded}
                        />
                    )
                ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt="Thumbnail" className="w-full h-full object-cover" />
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                {/* Bottom info bar */}
                <div className="absolute bottom-0 left-0 right-0 px-3 py-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[11px] font-semibold text-white/90">
                            {kind === "video" ? "✅ Video ready" : "✅ Thumbnail ready"}
                        </span>
                        {fileSize > 0 && (
                            <span className="text-[10px] text-white/60 font-medium bg-black/30 px-1.5 py-0.5 rounded-md">
                                {formatSize(fileSize)}
                            </span>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onRemove}
                        className="text-white/70 hover:text-white text-[11px] font-medium bg-black/30 hover:bg-black/50 px-2 py-0.5 rounded-lg transition-all shrink-0"
                    >
                        Remove
                    </button>
                </div>
            </div>

            {/* Filename */}
            <div className="px-4 py-2.5 flex items-center gap-2 border-t border-[var(--border-solid)]">
                <span className="text-base">{kind === "video" ? "🎬" : "🖼️"}</span>
                <p className="text-xs text-[var(--muted)] truncate flex-1">{fileName}</p>
            </div>
        </div>
    );
}

/* ─── Sub-component: upload zone with progress ───── */
function UploadZone({
    endpoint,
    label,
    hint,
    progress,
    uploading,
    fileSize,
    onBeforeUpload,
    onProgress,
    onComplete,
    onError,
}: {
    endpoint: "videoUploader" | "thumbnailUploader";
    label: string;
    hint: string;
    progress: number;
    uploading: boolean;
    fileSize: number;
    onBeforeUpload: (files: File[]) => File[];
    onProgress: (p: number) => void;
    onComplete: (url: string) => void;
    onError: (msg: string) => void;
}) {
    return (
        <div className="flex flex-col gap-2">
            {uploading && (
                <div className="rounded-2xl border border-[var(--border-solid)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]">
                    {/* Uploading state */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-sm font-semibold text-[var(--text)]">Uploading…</span>
                        </div>
                        <span className="text-sm font-bold text-blue-600">{progress}%</span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {fileSize > 0 && (
                        <p className="text-xs text-[var(--muted)] mt-2">
                            File size: <span className="font-medium text-[var(--text)]">{formatSize(fileSize)}</span>
                        </p>
                    )}
                </div>
            )}

            {!uploading && (
                <UploadDropzone
                    endpoint={endpoint}
                    appearance={{
                        button: { background: "var(--primary)", color: "white", cursor: "pointer", padding: "10px", marginTop: "20px"},
                        container: { display: "flex", justifyContent: "center", alignItems: "center", width: "300px" },
                        allowedContent: { marginTop: "20px" },
                        uploadIcon: { cursor: "pointer" },
                    }}
                    onBeforeUploadBegin={(files) => {
                        onBeforeUpload(files);
                        return files;
                    }}
                    onUploadProgress={(p) => onProgress(Math.round(p))}
                    onClientUploadComplete={(res) => {
                        if (res?.[0]) onComplete(res[0].ufsUrl);
                        onProgress(100);
                    }}
                    content={{ label, allowedContent: hint }}
                    onUploadError={(err) => onError(err.message)}
                />
            )}
        </div>
    );
}

/* ─── Main Page ───────────────────────────────────── */
export default function UploadPage() {
    const router = useRouter();
    const { setIsUploading } = useUpload();

    const [videoType, setVideoType] = useState<"video" | "short">("video");

    // Video upload state
    const [videoUrl, setVideoUrl] = useState("");
    const [videoProgress, setVideoProgress] = useState(0);
    const [videoUploading, setVideoUploading] = useState(false);
    const [videoFileSize, setVideoFileSize] = useState(0);
    const [videoFileName, setVideoFileName] = useState("");
    const [videoPreviewFrame, setVideoPreviewFrame] = useState("");

    // Thumbnail upload state
    const [thumbnailUrl, setThumbnailUrl] = useState("");
    const [thumbnailProgress, setThumbnailProgress] = useState(0);
    const [thumbnailUploading, setThumbnailUploading] = useState(false);
    const [thumbnailFileSize, setThumbnailFileSize] = useState(0);
    const [thumbnailFileName, setThumbnailFileName] = useState("");

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [tags, setTags] = useState("");
    const [privacy, setPrivacy] = useState("public");
    const [scheduledDate, setScheduledDate] = useState("");
    const [scheduledTime, setScheduledTime] = useState("");
    const [submitStatus, setSubmitStatus] = useState<UploadStatus>("idle");
    const [error, setError] = useState("");

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const captureVideoFrame = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;
        try {
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 360;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                setVideoPreviewFrame(canvas.toDataURL("image/jpeg", 0.75));
            }
        } catch {
            // CORS may block — video element still shows the frame natively
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!videoUrl) { setError("Please upload a video file."); return; }
        if (!title.trim()) { setError("Please enter a video title."); return; }
        if (!scheduledDate || !scheduledTime) { setError("Please set a scheduled date and time."); return; }
        const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
        if (new Date(scheduledAt) <= new Date()) { setError("Scheduled time must be in the future."); return; }

        try {
            setSubmitStatus("saving");
            const res = await fetch("/api/videos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim(),
                    tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
                    privacy, videoType,
                    storageUrl: videoUrl,
                    thumbnailUrl: thumbnailUrl || null,
                    scheduledAt,
                }),
            });
            if (!res.ok) throw new Error("Failed to save video");
            setSubmitStatus("done");
            setTimeout(() => router.push("/dashboard"), 1500);
        } catch (err: unknown) {
            setSubmitStatus("error");
            setError(err instanceof Error ? err.message : "Something went wrong.");
        }
    };

    return (
        <div className="p-6">
            {/* Hidden canvas for frame capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Page header */}
            <div className="mb-6 lg:mb-8">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--text)] tracking-tight mb-1">
                    Schedule a Video
                </h1>
                <p className="text-[var(--muted)] text-sm lg:text-base">
                    Upload your content and set the exact time it goes live on YouTube.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 lg:gap-6">

                {/* ── Card: Video Type ───────────────────── */}
                <FormCard title="Video Type">
                    <div className="grid grid-cols-2 gap-3">
                        {([
                            { value: "video", emoji: "📹", label: "Normal Video", desc: "Standard YouTube video" },
                            { value: "short", emoji: "🩳", label: "YouTube Short", desc: "Vertical · max 60s" },
                        ] as const).map(({ value, emoji, label, desc }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setVideoType(value)}
                                className={[
                                    "flex flex-col gap-1 p-3 sm:p-4 rounded-xl text-left transition-all duration-150 border-2 cursor-pointer",
                                    videoType === value
                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                                        : "border-[var(--border-solid)] bg-[var(--surface-2)] hover:border-slate-300 dark:hover:border-slate-600",
                                ].join(" ")}
                            >
                                <span className="text-xl sm:text-2xl">{emoji}</span>
                                <div className={`font-semibold text-xs sm:text-sm ${videoType === value ? "text-blue-700 dark:text-blue-400" : "text-[var(--text)]"}`}>
                                    {label}
                                </div>
                                <div className="text-[11px] sm:text-xs text-[var(--muted)]">{desc}</div>
                            </button>
                        ))}
                    </div>
                </FormCard>

                {/* ── YouTube Verification Notice (Normal Video only) ── */}
                {videoType === "video" && (
                    <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-900">
                        <span className="text-lg shrink-0 mt-0.5">ℹ️</span>
                        <div>
                            <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-0.5 lg:text-base">
                                YouTube account verification required for videos more then 15 minutes
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-400 lg:text-base">
                                This is a YouTube rule, not an app rule.
                                If you want to upload long videos please verify your phone number at{" "}
                                <a
                                    href="https://www.youtube.com/verify"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline font-medium hover:text-blue-900 dark:hover:text-blue-200"
                                >
                                    youtube.com/verify
                                </a>
                                . Verification is free and takes 2 minutes.
                            </p>
                        </div>
                    </div>
                )}

                {/* ── Card: Upload Files ─────────────────── */}
                <FormCard title="Upload Files">
                    <div className="flex justify-around items-center flex-wrap">

                        {/* Video file */}
                        <div className="flex flex-col gap-2">
                            <SectionLabel text="Video File" required />
                            {videoUrl ? (
                                <UploadedMediaCard
                                    kind="video"
                                    url={videoUrl}
                                    fileName={videoFileName}
                                    fileSize={videoFileSize}
                                    progress={videoProgress}
                                    previewFrame={videoPreviewFrame}
                                    videoRef={videoRef}
                                    onVideoLoaded={captureVideoFrame}
                                    onRemove={() => {
                                        setVideoUrl(""); setVideoProgress(0);
                                        setVideoFileSize(0); setVideoFileName("");
                                        setVideoPreviewFrame("");
                                        setIsUploading(false);
                                    }}
                                />
                            ) : (
                                <UploadZone
                                    endpoint="videoUploader"
                                    label="Drop video here or click to browse"
                                    hint="MP4, MOV, AVI — max 2GB"
                                    progress={videoProgress}
                                    uploading={videoUploading}
                                    fileSize={videoFileSize}
                                    onBeforeUpload={(files) => {
                                        const f = files[0];
                                        if (f) {
                                            setVideoFileSize(f.size);
                                            setVideoFileName(f.name);
                                            setVideoUploading(true);
                                            setVideoProgress(0);
                                            setIsUploading(true);
                                        }
                                        return files;
                                    }}
                                    onProgress={(p) => setVideoProgress(p)}
                                    onComplete={(url) => {
                                        setVideoUrl(url);
                                        setVideoUploading(false);
                                        setIsUploading(false);
                                    }}
                                    onError={(msg) => {
                                        setError(msg);
                                        setVideoUploading(false);
                                        setIsUploading(false);
                                    }}
                                />
                            )}
                        </div>

                        {/* Thumbnail — Normal video only */}
                        {videoType === "video" && (
                            <div className="flex flex-col gap-2">
                                <SectionLabel text="Thumbnail" optional />
                                {thumbnailUrl ? (
                                    <UploadedMediaCard
                                        kind="image"
                                        url={thumbnailUrl}
                                        fileName={thumbnailFileName}
                                        fileSize={thumbnailFileSize}
                                        progress={thumbnailProgress}
                                        onRemove={() => {
                                            setThumbnailUrl(""); setThumbnailProgress(0);
                                            setThumbnailFileSize(0); setThumbnailFileName("");
                                            setIsUploading(false);
                                        }}
                                    />
                                ) : (
                                    <UploadZone
                                        endpoint="thumbnailUploader"
                                        label="Drop thumbnail here or click to browse"
                                        hint="JPG, PNG — max 8MB"
                                        progress={thumbnailProgress}
                                        uploading={thumbnailUploading}
                                        fileSize={thumbnailFileSize}
                                        onBeforeUpload={(files) => {
                                            const f = files[0];
                                            if (f) {
                                                setThumbnailFileSize(f.size);
                                                setThumbnailFileName(f.name);
                                                setThumbnailUploading(true);
                                                setThumbnailProgress(0);
                                                setIsUploading(true);
                                            }
                                            return files;
                                        }}
                                        onProgress={(p) => setThumbnailProgress(p)}
                                        onComplete={(url) => {
                                            setThumbnailUrl(url);
                                            setThumbnailUploading(false);
                                            setIsUploading(false);
                                        }}
                                        onError={(msg) => {
                                            setError(msg);
                                            setThumbnailUploading(false);
                                            setIsUploading(false);
                                        }}
                                    />
                                )}
                            </div>
                        )}

                        {/* Shorts info note */}
                        {videoType === "short" && (
                            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900 col-span-full">
                                <span className="text-lg shrink-0">💡</span>
                                <p className="text-xs text-amber-800 dark:text-amber-300">
                                    YouTube Shorts use an auto-generated thumbnail — no custom thumbnail needed.
                                </p>
                            </div>
                        )}
                    </div>
                </FormCard>

                {/* ── Card: Video Details ────────────────── */}
                <FormCard title="Video Details">
                    <div className="flex flex-col gap-4">
                        {/* Title */}
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                                <SectionLabel text="Title" required />
                                <span className="text-xs text-[var(--muted)]">{title.length}/100</span>
                            </div>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                maxLength={100}
                                placeholder="Enter your video title…"
                                className={inputCls}
                            />
                        </div>

                        {/* Description */}
                        <div className="flex flex-col gap-1.5">
                            <SectionLabel
                                text={videoType === "short" ? "Description / Bio" : "Description"}
                                hint={videoType === "short" ? "Supports #hashtags" : undefined}
                            />
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                maxLength={5000}
                                rows={4}
                                placeholder="Describe your video…"
                                className={`${inputCls} resize-y font-[inherit]`}
                            />
                        </div>

                        {/* Tags + Privacy — 2 cols on md+ */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <SectionLabel text="Tags" hint="comma-separated" />
                                <input
                                    type="text"
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    placeholder="gaming, tutorial, vlog"
                                    className={inputCls}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <SectionLabel text="Privacy" />
                                <select
                                    value={privacy}
                                    onChange={(e) => setPrivacy(e.target.value)}
                                    className={`${inputCls} cursor-pointer`}
                                >
                                    <option value="public">🌍 Public</option>
                                    <option value="unlisted">🔗 Unlisted</option>
                                    <option value="private">🔒 Private</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </FormCard>

                {/* ── Card: Schedule ─────────────────────── */}
                <FormCard title="Schedule">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <SectionLabel text="Date" required />
                            <input
                                type="date"
                                value={scheduledDate}
                                onChange={(e) => setScheduledDate(e.target.value)}
                                min={new Date().toISOString().split("T")[0]}
                                className={`${inputCls} cursor-pointer`}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <SectionLabel text="Time" required />
                            <input
                                type="time"
                                value={scheduledTime}
                                onChange={(e) => setScheduledTime(e.target.value)}
                                className={`${inputCls} cursor-pointer`}
                            />
                        </div>
                    </div>
                    <p className="text-xs text-[var(--muted)] mt-3 flex items-center gap-1">
                        <span>🕐</span> Uses your local browser timezone.
                    </p>
                </FormCard>

                {/* ── Error banner ───────────────────────── */}
                {error && (
                    <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-2 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400">
                        <span>⚠️</span> {error}
                    </div>
                )}

                {/* ── Success banner ─────────────────────── */}
                {submitStatus === "done" && (
                    <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium flex items-center gap-2 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-400">
                        <span>✅</span> Video scheduled! Redirecting to dashboard…
                    </div>
                )}

                {/* ── Submit ─────────────────────────────── */}
                <button
                    type="submit"
                    disabled={submitStatus === "saving" || videoUploading || thumbnailUploading}
                    className="btn-primary w-full py-3.5 text-sm sm:text-base justify-center rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {submitStatus === "saving"
                        ? "⏳ Saving…"
                        : videoUploading || thumbnailUploading
                            ? "⬆ Upload in progress…"
                            : "🚀 Schedule Video"}
                </button>
            </form>
        </div>
    );
}

/* ─── Tiny helper sub-components ─────────────────── */
function FormCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-solid)] shadow-[var(--shadow-sm)] overflow-hidden">
            <div className="px-4 sm:px-5 py-3 border-b border-[var(--border-solid)] bg-[var(--surface-2)]">
                <h2 className="text-sm font-semibold text-[var(--text)]">{title}</h2>
            </div>
            <div className="p-4 sm:p-5">{children}</div>
        </div>
    );
}

function SectionLabel({ text, required, optional, hint }: {
    text: string; required?: boolean; optional?: boolean; hint?: string;
}) {
    return (
        <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">
            {text}
            {required && <span className="text-red-500 normal-case font-bold">*</span>}
            {optional && <span className="normal-case font-normal text-[var(--muted)]">(optional)</span>}
            {hint && <span className="normal-case font-normal">· {hint}</span>}
        </label>
    );
}

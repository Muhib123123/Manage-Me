"use client";

import { useState, useRef, useEffect } from "react";
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
        <div className="rounded-xl w-[300px] lg:w-[400px] overflow-hidden border border-[var(--border-solid)] bg-[var(--surface)] shadow-[var(--shadow-sm)] group transition-all duration-300 hover:shadow-[var(--shadow-md)]">
            {/* Preview */}
            <div className="relative aspect-video bg-[var(--surface-2)] overflow-hidden">
                {kind === "video" ? (
                    previewFrame ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={previewFrame} alt="Preview" className="w-full h-full object-cover grayscale-[20%] group-hover:scale-105 transition-transform duration-500 ease-out" />
                    ) : (
                        <video
                            ref={videoRef}
                            src={url}
                            preload="metadata"
                            muted
                            playsInline
                            className="w-full h-full object-cover grayscale-[20%] group-hover:scale-105 transition-transform duration-500 ease-out"
                            onLoadedMetadata={onVideoLoaded}
                        />
                    )
                ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt="Thumbnail" className="w-full h-full object-cover grayscale-[20%] group-hover:scale-105 transition-transform duration-500 ease-out" />
                )}

                {/* Subtle gradient overlay to ensure text legibility */}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

                {/* Info Actions Overlay */}
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <span className="text-[10px] font-medium tracking-wide text-white/90 bg-black/40 backdrop-blur-md px-2 py-1 rounded-md">
                        {kind === "video" ? "Video" : "Thumb"}
                    </span>
                    {fileSize > 0 && (
                        <span className="text-[10px] font-medium text-white/70">
                            {formatSize(fileSize)}
                        </span>
                    )}
                </div>

                <button
                    type="button"
                    onClick={onRemove}
                    className="absolute top-3 right-3 text-white/70 hover:text-white bg-black/40 hover:bg-black/60 backdrop-blur-md w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
                    aria-label="Remove uploaded file"
                >
                    ✕
                </button>
            </div>

            {/* Filename */}
            <div className="px-4 py-3 border-t border-[var(--border-solid)] bg-[var(--surface)]">
                <p className="text-xs text-[var(--text)] font-medium truncate">{fileName}</p>
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
    const wrapperRef = useRef<HTMLDivElement>(null);

    const getBtn = () =>
        wrapperRef.current?.querySelector("button") as HTMLElement | null;

    const showBtn = () => { const b = getBtn(); if (b) b.style.display = "block"; };
    const hideBtn = () => { const b = getBtn(); if (b) b.style.display = "none"; };

    useEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;

        const timer = setTimeout(() => {
            hideBtn();

            const input = wrapper.querySelector('input[type="file"]') as HTMLInputElement | null;
            if (!input) return;

            const handleChange = () => {
                if (input.files && input.files.length > 0) {
                    showBtn();
                } else {
                    hideBtn();
                }
            };

            input.addEventListener("change", handleChange);
            (wrapper as HTMLDivElement & { _cleanup?: () => void })._cleanup = () =>
                input.removeEventListener("change", handleChange);
        }, 100);

        return () => {
            clearTimeout(timer);
            const cleanup = (wrapper as HTMLDivElement & { _cleanup?: () => void })._cleanup;
            if (cleanup) cleanup();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="flex flex-col">
            {uploading && (
                <div className="rounded-xl w-[300px] lg:w-[400px] border border-[var(--border-solid)] bg-[var(--surface-2)] p-6 flex flex-col justify-center h-[200px]">
                    <div className="flex items-end justify-between mb-4">
                        <span className="text-sm font-semibold text-[var(--text)]">Uploading</span>
                        <span className="text-2xl font-light text-[var(--primary)]">{progress}%</span>
                    </div>

                    <div className="w-full h-1 bg-[var(--border-solid)] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[var(--primary)] transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {!uploading && (
                <div ref={wrapperRef} className="w-[300px] lg:w-[400px] [&>div]:!border-[var(--border-solid)] [&>div]:!bg-[var(--surface-2)] hover:[&>div]:!border-[var(--text)] transition-colors duration-300">
                    <UploadDropzone
                        endpoint={endpoint}
                        appearance={{
                            container: {
                                border: '1px dashed var(--border-solid)',
                                borderRadius: '12px',
                                background: 'transparent',
                                padding: '40px 20px',
                                transition: 'all 0.2s',
                            },
                            button: {
                                background: "var(--text)",
                                color: "var(--surface)",
                                borderRadius: "8px",
                                fontWeight: "500",
                                fontSize: "14px",
                                padding: "8px 24px"
                            },
                            label: { color: "var(--text)", fontWeight: "500", marginBottom: "4px" },
                            allowedContent: { color: "var(--muted)", fontSize: "12px", marginTop: "8px" },
                            uploadIcon: { color: "var(--muted)", width: "32px", height: "32px", marginBottom: "16px" }
                        }}
                        onBeforeUploadBegin={(files) => {
                            onBeforeUpload(files);
                            return files;
                        }}
                        onUploadProgress={(p) => onProgress(Math.round(p))}
                        onClientUploadComplete={(res) => {
                            if (res?.[0]) onComplete(res[0].ufsUrl);
                            onProgress(100);
                            hideBtn();
                        }}
                        content={{ label, allowedContent: hint }}
                        onUploadError={(err) => {
                            onError(err.message);
                            hideBtn();
                        }}
                    />
                </div>
            )}
        </div>
    );
}

/* ─── Main Form ───────────────────────────────────── */
export default function UploadForm({ channelName }: { channelName: string }) {
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
        <div className="p-6 md:p-10 max-w-[1000px] mx-auto">
            {/* Hidden canvas for frame capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Page header */}
            <div className="mb-12 md:mb-16">
                <h1 className="text-3xl md:text-5xl font-['Playfair_Display'] font-medium text-[var(--foreground)] tracking-tight mb-4 hidden md:block">
                    Schedule a YouTube Video
                </h1>
                <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)] mb-2 md:hidden">
                    Schedule
                </h1>
                <p className="text-[var(--muted)] text-sm md:text-base max-w-2xl leading-relaxed">
                    Upload your content and set the exact time it goes live on your channel.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-10 md:gap-14">

                {/* ── Card: Video Type ───────────────────── */}
                <FormCard title="1. Select Video Type">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {([
                            { value: "video", label: "Normal Video", desc: "Standard horizontal format" },
                            { value: "short", label: "YouTube Short", desc: "Vertical format under 60s" },
                        ] as const).map(({ value, label, desc }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setVideoType(value)}
                                className={[
                                    "flex flex-col gap-1.5 p-5 rounded-xl text-left transition-all duration-300 border cursor-pointer group",
                                    videoType === value
                                        ? "border-[var(--text)] bg-[var(--surface-2)] shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:shadow-none"
                                        : "border-[var(--border-solid)] bg-transparent hover:bg-[var(--surface)] hover:border-[var(--text)]/30",
                                ].join(" ")}
                            >
                                <div className={`font-semibold text-base ${videoType === value ? "text-[var(--text)]" : "text-[var(--text)]"}`}>
                                    {label}
                                </div>
                                <div className="text-sm text-[var(--muted)] group-hover:text-[var(--text)]/70 transition-colors">{desc}</div>
                            </button>
                        ))}
                    </div>
                </FormCard>

                {/* ── YouTube Verification Notice (Normal Video only) ── */}
                {videoType === "video" && (
                    <div className="flex items-start gap-4 px-5 py-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border-solid)] text-sm">
                        <span className="text-lg shrink-0 mt-0.5">ℹ️</span>
                        <div className="flex flex-col gap-1.5">
                            <p className="font-semibold text-[var(--text)]">
                                Verification required for videos over 15 minutes
                            </p>
                            <p className="text-[var(--muted)] leading-relaxed">
                                Due to YouTube API rules, accounts must be phone-verified to upload long-form content.
                            </p>
                            <p className="text-[var(--text)] leading-relaxed mt-1 p-3 bg-[var(--surface)] border border-blue-500/30 rounded-lg shadow-sm">
                                <strong>Important:</strong> You are currently connected to the channel <strong>"{channelName}"</strong>.
                                <br />Before clicking the link below, please ensure you are logged into YouTube with the correct email for <strong>"{channelName}"</strong>, otherwise you might verify the wrong account.
                            </p>
                            <a
                                href="https://www.youtube.com/verify"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex mt-2 items-center gap-2 underline text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                            >
                                Go to youtube.com/verify →
                            </a>
                        </div>
                    </div>
                )}

                {/* ── Card: Upload Files ─────────────────── */}
                <FormCard title="2. Upload Media">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

                        {/* Video file */}
                        <div className="flex flex-col gap-4">
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
                                    label="Upload video file"
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
                        <div className="flex flex-col gap-4">
                            {videoType === "video" ? (
                                <>
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
                                            label="Upload thumbnail"
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
                                </>
                            ) : (
                                <div className="h-full flex items-center justify-center p-8 border border-dashed border-[var(--border-solid)] rounded-xl bg-[var(--surface-2)]">
                                    <p className="text-sm text-[var(--muted)] text-center max-w-[200px]">
                                        YouTube uses auto-generated thumbnails for Shorts.
                                    </p>
                                </div>
                            )}
                        </div>

                    </div>
                </FormCard>

                {/* ── Card: Video Details ────────────────── */}
                <FormCard title="3. Video Metadata">
                    <div className="flex flex-col gap-8">
                        {/* Title */}
                        <div className="flex flex-col gap-2.5">
                            <div className="flex items-center justify-between">
                                <SectionLabel text="Video Title" required />
                                <span className={`text-xs ${title.length > 90 ? 'text-red-500' : 'text-[var(--muted)]'}`}>
                                    {title.length}/100
                                </span>
                            </div>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                maxLength={100}
                                placeholder="A compelling title for your video"
                                className={inputCls}
                            />
                        </div>

                        {/* Description */}
                        <div className="flex flex-col gap-2.5">
                            <div className="flex items-center justify-between">
                                <SectionLabel
                                    text="Description"
                                />
                                <span className={`text-xs ${description.length > 4900 ? 'text-red-500' : 'text-[var(--muted)]'}`}>
                                    {description.length}/5000
                                </span>
                            </div>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                maxLength={5000}
                                rows={6}
                                placeholder="Describe your video. Include links and hashtags."
                                className={`${inputCls} resize-y leading-relaxed`}
                            />
                        </div>

                        {/* Tags + Privacy */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="flex flex-col gap-2.5">
                                <SectionLabel text="Tags" hint="comma-separated" />
                                <input
                                    type="text"
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    placeholder="design, tutorial, software"
                                    className={inputCls}
                                />
                            </div>
                            <div className="flex flex-col gap-2.5">
                                <SectionLabel text="Privacy Status" required />
                                <select
                                    value={privacy}
                                    onChange={(e) => setPrivacy(e.target.value)}
                                    className={`${inputCls} cursor-pointer appearance-none bg-no-repeat`}
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239CA3AF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
                                        backgroundPosition: "right 1rem center",
                                        backgroundSize: "0.65em auto",
                                    }}
                                >
                                    <option value="public">Public</option>
                                    <option value="unlisted">Unlisted</option>
                                    <option value="private">Private</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </FormCard>

                {/* ── Card: Schedule ─────────────────────── */}
                <FormCard title="4. Scheduling">
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="flex flex-col gap-2.5">
                                <SectionLabel text="Publication Date" required />
                                <input
                                    type="date"
                                    value={scheduledDate}
                                    onChange={(e) => setScheduledDate(e.target.value)}
                                    min={new Date().toISOString().split("T")[0]}
                                    className={`${inputCls} cursor-pointer`}
                                />
                            </div>
                            <div className="flex flex-col gap-2.5">
                                <SectionLabel text="Time" required />
                                <input
                                    type="time"
                                    value={scheduledTime}
                                    onChange={(e) => setScheduledTime(e.target.value)}
                                    className={`${inputCls} cursor-pointer`}
                                />
                            </div>
                        </div>
                        <p className="text-xs text-[var(--muted)] flex items-center gap-1.5 mt-2">
                            <span>🕒</span> Scheduled relative to your local browser timezone.
                        </p>
                    </div>
                </FormCard>

                {/* ── Error banner ───────────────────────── */}
                {error && (
                    <div className="px-5 py-4 rounded-xl bg-red-50 text-red-700 text-sm font-medium border border-red-100 flex items-center gap-3">
                        <span className="text-lg">⚠</span> {error}
                    </div>
                )}

                {/* ── Success banner ─────────────────────── */}
                {submitStatus === "done" && (
                    <div className="px-5 py-4 rounded-xl bg-[var(--surface-2)] text-[var(--text)] text-sm font-medium border border-[var(--border-solid)] flex items-center gap-3">
                        <span className="text-lg text-emerald-500">✅</span>
                        Video successfully scheduled! Redirecting...
                    </div>
                )}

                {/* ── Submit ─────────────────────────────── */}
                <div className="pt-6 border-t border-[var(--border-solid)] flex justify-end">
                    <button
                        type="submit"
                        disabled={submitStatus === "saving" || videoUploading || thumbnailUploading}
                        className="px-8 py-4 bg-[var(--text)] hover:bg-[var(--text)]/90 text-[var(--surface)] font-medium text-base rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] dark:shadow-none min-w-[200px]"
                    >
                        {submitStatus === "saving"
                            ? "Saving..."
                            : videoUploading || thumbnailUploading
                                ? "Waiting for uploads..."
                                : "Schedule Video"}
                    </button>
                </div>
            </form>
        </div>
    );
}

/* ─── Tiny helper sub-components ─────────────────── */
function FormCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="flex flex-col gap-6">
            <h2 className="text-xl md:text-2xl font-['Playfair_Display'] font-medium text-[var(--text)]">
                {title}
            </h2>
            <div className="p-0 md:p-2">
                {children}
            </div>
        </section>
    );
}

function SectionLabel({ text, required, optional, hint }: {
    text: string; required?: boolean; optional?: boolean; hint?: string;
}) {
    return (
        <label className="flex items-center gap-1.5 text-sm font-medium text-[var(--text)]">
            {text}
            {required && <span className="text-red-500" aria-label="required">*</span>}
            {optional && <span className="font-normal tracking-wide text-[var(--muted)] text-xs uppercase ml-2">(optional)</span>}
            {hint && <span className="font-normal text-[var(--muted)] text-xs ml-2">({hint})</span>}
        </label>
    );
}

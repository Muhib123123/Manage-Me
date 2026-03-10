"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { UploadButton } from "@/lib/uploadthing";
import { useUpload } from "@/contexts/UploadContext";
import { DatePicker, TimePicker } from "@/components/DateTimePicker";

type UploadStatus = "idle" | "saving" | "done" | "error";
type PrivacyLevel = "PUBLIC_TO_EVERYONE" | "MUTUAL_FOLLOW_FRIENDS" | "SELF_ONLY";

/* ─── Helpers ─────────────────────────────────────── */
function formatSize(bytes: number) {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const inputCls =
    "w-full px-4 py-3 rounded-xl border border-[var(--border-solid)] bg-[var(--surface)] " +
    "text-[var(--text)] text-sm outline-none " +
    "focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 " +
    "placeholder:text-[var(--muted)]";

/* ─── Sub-component: video preview card ──────────── */
function UploadedVideoCard({
    url,
    fileName,
    fileSize,
    progress,
    previewFrame,
    onRemove,
    videoRef,
    onVideoLoaded,
}: {
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
        <div className="rounded-xl w-full max-w-[400px] overflow-hidden border border-[var(--border-solid)] bg-[var(--surface)] shadow-[var(--shadow-sm)] group hover:shadow-[var(--shadow-md)]">
            <div className="relative aspect-[9/16] bg-[var(--surface-2)] overflow-hidden max-h-[320px]">
                {previewFrame ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewFrame} alt="Preview" className="w-full h-full object-cover grayscale-[20%] group-hover:scale-105 ease-out" />
                ) : (
                    <video
                        ref={videoRef}
                        src={url}
                        preload="metadata"
                        muted
                        playsInline
                        className="w-full h-full object-cover grayscale-[20%] group-hover:scale-105 ease-out"
                        onLoadedMetadata={onVideoLoaded}
                    />
                )}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <span className="text-[10px] font-medium tracking-wide text-white/90 bg-black/40 backdrop-blur-md px-2 py-1 rounded-md">
                        Video
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
                    className="absolute top-3 right-3 text-white/70 hover:text-white bg-black/40 hover:bg-black/60 backdrop-blur-md w-7 h-7 flex items-center justify-center rounded-full cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100 border border-white/10 shadow-sm"
                    aria-label="Remove uploaded file"
                >
                    ✕
                </button>
                {/* Upload progress bar overlay */}
                {progress > 0 && progress < 100 && (
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-[var(--border-solid)]">
                        <div className="h-full bg-white" style={{ width: `${progress}%` }} />
                    </div>
                )}
            </div>
            <div className="px-4 py-3 border-t border-[var(--border-solid)] bg-[var(--surface)]">
                <p className="text-xs text-[var(--text)] font-medium truncate">{fileName}</p>
            </div>
        </div>
    );
}

/* ─── Sub-component: upload drop zone ────────────── */
function UploadZone({
    progress,
    uploading,
    onBeforeUpload,
    onProgress,
    onComplete,
    onError,
}: {
    progress: number;
    uploading: boolean;
    onBeforeUpload: (files: File[]) => File[];
    onProgress: (p: number) => void;
    onComplete: (urls: string[]) => void;
    onError: (msg: string) => void;
}) {
    return (
        <div className="flex flex-col">
            {uploading && (
                <div className="rounded-xl w-full max-w-[400px] border border-[var(--border-solid)] bg-[var(--surface-2)] p-6 flex flex-col justify-center h-[200px]">
                    <div className="flex items-end justify-between mb-4">
                        <span className="text-sm font-semibold text-[var(--text)]">Uploading</span>
                        <span className="text-2xl font-light text-[var(--primary)]">{progress}%</span>
                    </div>
                    <div className="w-full h-1 bg-[var(--border-solid)] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[var(--primary)] ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}
            {!uploading && (
                <div className="w-full max-w-[400px] border border-dashed border-[var(--border-solid)] hover:border-[var(--text)] rounded-xl bg-[var(--surface-2)] p-10 flex flex-col items-center gap-3">
                    <svg className="w-8 h-8 text-[var(--muted)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <p className="text-sm font-medium text-[var(--text)]">Upload TikTok video</p>
                    <p className="text-xs text-[var(--muted)] text-center">MP4, MOV, WebM — up to 4GB</p>
                    <div className="[&_[data-ut-element='allowed-content']]:!hidden [&_.ut-allowed-content]:!hidden [&_input[type='file']]:!hidden">
                        <UploadButton
                            endpoint="tiktokVideoUploader"
                            appearance={{
                                button: {
                                    background: "var(--text)",
                                    color: "var(--surface)",
                                    borderRadius: "8px",
                                    fontWeight: "500",
                                    fontSize: "14px",
                                    padding: "8px 24px",
                                    cursor: "pointer",
                                    marginTop: "4px",
                                },
                                allowedContent: { display: "none" },
                            }}
                            onBeforeUploadBegin={(files) => {
                                onBeforeUpload(files);
                                return files;
                            }}
                            onUploadProgress={(p) => onProgress(Math.round(p))}
                            onClientUploadComplete={(res) => {
                                if (res && res.length > 0) {
                                    onComplete(res.map(r => r.ufsUrl));
                                }
                                onProgress(100);
                            }}
                            onUploadError={(err) => {
                                onError(err.message);
                            }}
                            content={{ allowedContent: "" }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─── Privacy option config ──────────────────────── */
const PRIVACY_OPTIONS: { value: PrivacyLevel; label: string; desc: string }[] = [
    { value: "PUBLIC_TO_EVERYONE", label: "🌍 Public", desc: "Anyone can view this video" },
    { value: "MUTUAL_FOLLOW_FRIENDS", label: "👥 Followers", desc: "Only mutual followers can view" },
    { value: "SELF_ONLY", label: "🔒 Private", desc: "Only you can view this video" },
];

/* ─── Main Form ───────────────────────────────────── */
export default function TikTokUploadFormClient({ accountName }: { accountName: string }) {
    const router = useRouter();
    const { setIsUploading } = useUpload();

    // Video upload state
    const [videoUrl, setVideoUrl] = useState("");
    const [videoFile, setVideoFile] = useState<{ name: string; size: number } | null>(null);
    const [videoProgress, setVideoProgress] = useState(0);
    const [videoUploading, setVideoUploading] = useState(false);
    const [videoPreviewFrame, setVideoPreviewFrame] = useState("");

    // Form state
    const [caption, setCaption] = useState("");
    const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>("PUBLIC_TO_EVERYONE");
    const [allowDuet, setAllowDuet] = useState(true);
    const [allowStitch, setAllowStitch] = useState(true);
    const [allowComment, setAllowComment] = useState(true);
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
            canvas.width = video.videoWidth || 360;
            canvas.height = video.videoHeight || 640;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                setVideoPreviewFrame(canvas.toDataURL("image/jpeg", 0.75));
            }
        } catch {
            // CORS may block
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!videoUrl) { setError("Please upload your TikTok video."); return; }
        if (!scheduledDate || !scheduledTime) { setError("Please set a scheduled date and time."); return; }

        const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
        if (new Date(scheduledAt) <= new Date()) { setError("Scheduled time must be in the future."); return; }

        try {
            setSubmitStatus("saving");
            const res = await fetch("/api/tiktok/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    videoUrl,
                    caption: caption.trim(),
                    privacyLevel,
                    allowDuet,
                    allowStitch,
                    allowComment,
                    scheduledAt,
                }),
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({ error: "Unknown server error" }));
                throw new Error(errData.error || "Failed to schedule post");
            }
            setSubmitStatus("done");
            setTimeout(() => router.push("/tiktok-dashboard"), 1500);
        } catch (err: unknown) {
            setSubmitStatus("error");
            setError(err instanceof Error ? err.message : "Something went wrong.");
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-[1000px] mx-auto">
            <canvas ref={canvasRef} className="hidden" />

            <div className="mb-12 md:mb-16">
                <h1 className="text-3xl md:text-5xl font-medium text-[var(--text)] tracking-tight mb-4 hidden md:block">
                    Schedule a TikTok Video
                </h1>
                <h1 className="text-3xl font-bold tracking-tight text-[var(--text)] mb-2 md:hidden">
                    Schedule TikTok
                </h1>
                <p className="text-[var(--muted)] text-sm md:text-base max-w-2xl leading-relaxed">
                    Upload your video and schedule it to publish to <strong>@{accountName}</strong>.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-10 md:gap-14">

                {/* ── Video Upload ──────────────────────── */}
                <FormCard title="Upload Video">
                    <div className="flex flex-col gap-4">
                        <SectionLabel text="Video File" required />
                        {videoUrl ? (
                            <UploadedVideoCard
                                url={videoUrl}
                                fileName={videoFile?.name || "upload"}
                                fileSize={videoFile?.size || 0}
                                progress={videoProgress}
                                previewFrame={videoPreviewFrame}
                                videoRef={videoRef}
                                onVideoLoaded={captureVideoFrame}
                                onRemove={() => {
                                    setVideoUrl("");
                                    setVideoFile(null);
                                    setVideoProgress(0);
                                    setVideoPreviewFrame("");
                                    setIsUploading(false);
                                }}
                            />
                        ) : (
                            <UploadZone
                                progress={videoProgress}
                                uploading={videoUploading}
                                onBeforeUpload={(files) => {
                                    setVideoFile({ name: files[0].name, size: files[0].size });
                                    setVideoUploading(true);
                                    setVideoProgress(0);
                                    setIsUploading(true);
                                    return files;
                                }}
                                onProgress={(p) => setVideoProgress(p)}
                                onComplete={(urls) => {
                                    setVideoUrl(urls[0]);
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
                </FormCard>

                {/* ── Caption ───────────────────────────── */}
                <FormCard title="Caption">
                    <div className="flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                            <SectionLabel text="Caption" optional />
                            <span className={`text-xs ${caption.length > 2100 ? "text-red-500" : "text-[var(--muted)]"}`}>
                                {caption.length}/2200
                            </span>
                        </div>
                        <textarea
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            maxLength={2200}
                            rows={5}
                            placeholder="Write a caption… add hashtags with # and mention creators with @"
                            className={`${inputCls} resize-y leading-relaxed`}
                        />
                    </div>
                </FormCard>

                {/* ── Privacy ───────────────────────────── */}
                <FormCard title="Privacy">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {PRIVACY_OPTIONS.map(({ value, label, desc }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setPrivacyLevel(value)}
                                className={[
                                    "flex flex-col gap-1.5 p-5 rounded-xl text-left border cursor-pointer group",
                                    privacyLevel === value
                                        ? "border-[var(--text)] bg-[var(--surface-2)] shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:shadow-none"
                                        : "border-[var(--border-solid)] bg-transparent hover:bg-[var(--surface)] hover:border-[var(--text)]/30",
                                ].join(" ")}
                            >
                                <div className="font-semibold text-base text-[var(--text)]">{label}</div>
                                <div className="text-sm text-[var(--muted)] group-hover:text-[var(--text)]/70">{desc}</div>
                            </button>
                        ))}
                    </div>
                </FormCard>

                {/* ── Permissions ───────────────────────── */}
                <FormCard title="Permissions">
                    <div className="flex flex-col gap-4">
                        {([
                            { key: "allowDuet", label: "Allow Duet", desc: "Let others create Duets with this video", state: allowDuet, setter: setAllowDuet },
                            { key: "allowStitch", label: "Allow Stitch", desc: "Let others clip and integrate this video", state: allowStitch, setter: setAllowStitch },
                            { key: "allowComment", label: "Allow Comments", desc: "Let viewers comment on this video", state: allowComment, setter: setAllowComment },
                        ] as const).map(({ key, label, desc, state, setter }) => (
                            <label
                                key={key}
                                className="flex items-center justify-between p-4 rounded-xl border border-[var(--border-solid)] bg-[var(--surface)] cursor-pointer hover:bg-[var(--surface-2)] group"
                            >
                                <div>
                                    <p className="text-sm font-medium text-[var(--text)]">{label}</p>
                                    <p className="text-xs text-[var(--muted)] mt-0.5">{desc}</p>
                                </div>
                                <div className="relative ml-4 flex-shrink-0">
                                    <input
                                        type="checkbox"
                                        checked={state}
                                        onChange={(e) => setter(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-[var(--border-solid)] peer-checked:bg-[var(--text)] rounded-full" />
                                    <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white dark:bg-[var(--surface-2)] rounded-full shadow peer-checked:translate-x-5" />
                                </div>
                            </label>
                        ))}
                    </div>
                </FormCard>

                {/* ── Scheduling ────────────────────────── */}
                <FormCard title="Scheduling">
                    <div className="flex flex-col gap-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <SectionLabel text="Publication Date" required />
                                <DatePicker
                                    value={scheduledDate}
                                    onChange={setScheduledDate}
                                    min={new Date().toISOString().split("T")[0]}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <SectionLabel text="Time" required />
                                <TimePicker
                                    value={scheduledTime}
                                    onChange={setScheduledTime}
                                />
                            </div>
                        </div>
                        <p className="text-xs text-[var(--muted)] flex items-center gap-1.5">
                            <span>🕒</span> Scheduled relative to your local browser timezone.
                        </p>
                    </div>
                </FormCard>

                {error && (
                    <div className="px-5 py-4 rounded-xl bg-red-50 text-red-700 text-sm font-medium border border-red-100 flex items-center gap-3">
                        <span className="text-lg">⚠</span> {error}
                    </div>
                )}

                {submitStatus === "done" && (
                    <div className="px-5 py-4 rounded-xl bg-[var(--surface-2)] text-[var(--text)] text-sm font-medium border border-[var(--border-solid)] flex items-center gap-3">
                        <span className="text-lg text-emerald-500">✅</span>
                        Video successfully scheduled to TikTok!
                    </div>
                )}

                <div className="pt-6 border-t border-[var(--border-solid)] flex justify-end">
                    <button
                        type="submit"
                        disabled={submitStatus === "saving" || videoUploading}
                        className="px-8 py-4 bg-[var(--text)] hover:bg-[var(--text)]/90 text-[var(--surface)] font-medium text-base rounded-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] dark:shadow-none min-w-[200px] cursor-pointer"
                    >
                        {submitStatus === "saving"
                            ? "Scheduling..."
                            : videoUploading
                                ? "Waiting for upload..."
                                : "Schedule Video"}
                    </button>
                </div>
            </form>
        </div>
    );
}

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

function SectionLabel({ text, required, optional }: {
    text: string; required?: boolean; optional?: boolean;
}) {
    return (
        <label className="flex items-center gap-1.5 text-sm font-medium text-[var(--text)]">
            {text}
            {required && <span className="text-red-500" aria-label="required">*</span>}
            {optional && <span className="font-normal tracking-wide text-[var(--muted)] text-xs uppercase ml-2">(optional)</span>}
        </label>
    );
}

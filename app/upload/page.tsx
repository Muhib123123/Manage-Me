"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadDropzone } from "@/lib/uploadthing";

type UploadStatus = "idle" | "saving" | "done" | "error";

export default function UploadPage() {
    const router = useRouter();

    const [videoType, setVideoType] = useState<"video" | "short">("video");
    const [videoUrl, setVideoUrl] = useState("");
    const [thumbnailUrl, setThumbnailUrl] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [tags, setTags] = useState("");
    const [privacy, setPrivacy] = useState("public");
    const [scheduledDate, setScheduledDate] = useState("");
    const [scheduledTime, setScheduledTime] = useState("");
    const [status, setStatus] = useState<UploadStatus>("idle");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!videoUrl) { setError("Please upload a video file."); return; }
        if (!title.trim()) { setError("Please enter a video title."); return; }
        if (!scheduledDate || !scheduledTime) { setError("Please set a scheduled date and time."); return; }

        const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
        if (new Date(scheduledAt) <= new Date()) { setError("Scheduled time must be in the future."); return; }

        try {
            setStatus("saving");

            const res = await fetch("/api/videos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim(),
                    tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
                    privacy,
                    videoType,
                    storageUrl: videoUrl,
                    thumbnailUrl: thumbnailUrl || null,
                    scheduledAt,
                }),
            });

            if (!res.ok) throw new Error("Failed to save video");

            setStatus("done");
            setTimeout(() => router.push("/dashboard"), 1500);
        } catch (err: unknown) {
            setStatus("error");
            setError(err instanceof Error ? err.message : "Something went wrong.");
        }
    };

    return (
        <div style={{ maxWidth: "800px", margin: "0 auto", paddingBottom: "60px" }}>
            {/* Header */}
            <div style={{ marginBottom: "40px", textAlign: "center" }}>
                <h1 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "8px" }}>
                    Schedule a Video
                </h1>
                <p style={{ color: "var(--muted)", fontSize: "15px" }}>
                    Upload your video and set the exact time to publish to YouTube.
                </p>
            </div>

            <form onSubmit={handleSubmit} style={{ background: "var(--surface)", padding: "32px", borderRadius: "20px", border: "1px solid var(--border)" }}>

                {/* ── Video Type Toggle ─────────────────────── */}
                <Field label="Video Type">
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                        {([
                            { value: "video", label: "📹 Normal Video", desc: "Standard YouTube video" },
                            { value: "short", label: "🩳 YouTube Short", desc: "Vertical · max 60s" },
                        ] as const).map(({ value, label, desc }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setVideoType(value)}
                                style={{
                                    padding: "16px", borderRadius: "14px",
                                    border: videoType === value ? "2px solid var(--primary)" : "2px solid transparent",
                                    background: videoType === value ? "var(--primary-glow)" : "var(--surface-2)",
                                    cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                                }}
                            >
                                <div style={{ fontWeight: 600, fontSize: "15px", color: "var(--text)", marginBottom: "4px" }}>{label}</div>
                                <div style={{ fontSize: "13px", color: "var(--muted)" }}>{desc}</div>
                            </button>
                        ))}
                    </div>
                </Field>

                {/* ── File Uploads (Video & Thumbnail) ────────────────── */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: videoType === "video" ? "repeat(auto-fit, minmax(280px, 1fr))" : "1fr",
                    gap: "24px",
                    marginBottom: "24px"
                }}>
                    {/* Video File */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>
                            Video File *
                        </label>
                        {videoUrl ? (
                            <div style={{
                                padding: "20px", borderRadius: "14px",
                                background: "rgba(34,197,94,0.08)", border: "2px solid rgba(34,197,94,0.3)",
                                display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px",
                                flex: 1
                            }}>
                                <div>
                                    <p style={{ fontWeight: 600, fontSize: "15px", color: "#22c55e" }}>✅ Video uploaded</p>
                                    <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "4px", wordBreak: "break-all" }}>
                                        {videoUrl.split("/").pop()}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setVideoUrl("")}
                                    style={{ color: "var(--muted)", background: "var(--surface)", border: "1px solid var(--border)", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600, transition: "0.2s" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.borderColor = "var(--text)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                                >
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                                <UploadDropzone
                                    endpoint="videoUploader"
                                    appearance={{
                                        button: {
                                            background: "var(--primary)",
                                            color: "white",
                                            cursor: "pointer",
                                        }
                                    }}
                                    onClientUploadComplete={(res) => {
                                        if (res?.[0]) setVideoUrl(res[0].ufsUrl);
                                    }}
                                    content={{
                                        label: "Select Video File",
                                        button: "Upload Video",
                                        allowedContent: "MP4, MOV, AVI — max 2GB",
                                    }}
                                    onUploadError={(err) => setError(err.message)}
                                />
                            </div>
                        )}
                    </div>

                    {/* Thumbnail (Normal Video only) */}
                    {videoType === "video" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <label style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>
                                Thumbnail (optional)
                            </label>
                            {thumbnailUrl ? (
                                <div style={{
                                    padding: "16px 20px", borderRadius: "14px",
                                    background: "rgba(34,197,94,0.08)", border: "2px solid rgba(34,197,94,0.3)",
                                    display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px",
                                    flex: 1
                                }}>
                                    <p style={{ fontWeight: 600, fontSize: "14px", color: "#22c55e" }}>✅ Thumbnail uploaded</p>
                                    <button
                                        type="button"
                                        onClick={() => setThumbnailUrl("")}
                                        style={{ color: "var(--muted)", background: "var(--surface)", border: "1px solid var(--border)", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600, transition: "0.2s" }}
                                        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.borderColor = "var(--text)"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ) : (
                                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                                    <UploadDropzone
                                        endpoint="thumbnailUploader"
                                        appearance={{
                                            button: {
                                                background: "var(--primary)",
                                                color: "white",
                                                cursor: "pointer",
                                            }
                                        }}
                                        onClientUploadComplete={(res) => {
                                            if (res?.[0]) setThumbnailUrl(res[0].ufsUrl);
                                        }}
                                        content={{
                                            label: "Select Thumbnail Image",
                                            button: "Upload Image",
                                            allowedContent: "JPG, PNG — max 8MB",
                                        }}
                                        onUploadError={(err) => setError(err.message)}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Title ─────────────────────────────────── */}
                <Field label="Title *">
                    <input
                        type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                        maxLength={100} placeholder="Enter your video title…" style={inputStyle}
                        onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
                        onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                    />
                    <p style={{ color: "var(--muted)", fontSize: "12px", textAlign: "right", marginTop: "-4px" }}>
                        {title.length}/100
                    </p>
                </Field>

                {/* ── Description ───────────────────────────── */}
                <Field label={videoType === "short" ? "Description / Bio (supports #hashtags)" : "Description"}>
                    <textarea
                        value={description} onChange={(e) => setDescription(e.target.value)}
                        maxLength={5000} rows={5} placeholder="Describe your video…"
                        style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
                        onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
                        onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                    />
                </Field>

                {/* ── Tags ──────────────────────────────────── */}
                <Field label="Tags (comma-separated)">
                    <input
                        type="text" value={tags} onChange={(e) => setTags(e.target.value)}
                        placeholder="gaming, tutorial, vlog" style={inputStyle}
                        onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
                        onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                    />
                </Field>

                {/* ── Privacy ───────────────────────────────── */}
                <Field label="Privacy">
                    <select value={privacy} onChange={(e) => setPrivacy(e.target.value)}
                        style={{ ...inputStyle, cursor: "pointer", appearance: "none", backgroundImage: "url('data:image/svg+xml;utf8,<svg fill=\"gray\" height=\"24\" viewBox=\"0 0 24 24\" width=\"24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M7 10l5 5 5-5z\"/></svg>')", backgroundRepeat: "no-repeat", backgroundPositionX: "100%", backgroundPositionY: "50%" }}>
                        <option value="public">🌍 Public (Anyone can watch)</option>
                        <option value="unlisted">🔗 Unlisted (Anyone with link can watch)</option>
                        <option value="private">🔒 Private (Only you can watch)</option>
                    </select>
                </Field>

                {/* ── Schedule ──────────────────────────────── */}
                <Field label="Scheduled Date & Time *">
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                        <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)}
                            min={new Date().toISOString().split("T")[0]} style={{ ...inputStyle, cursor: "pointer" }}
                            onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
                            onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                        />
                        <input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)}
                            style={{ ...inputStyle, cursor: "pointer" }}
                            onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
                            onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                        />
                    </div>
                    <p style={{ color: "var(--muted)", fontSize: "12px" }}>Upload uses your local browser timezone.</p>
                </Field>

                {/* ── Error ─────────────────────────────────── */}
                {error && (
                    <div style={{
                        padding: "16px", borderRadius: "12px",
                        background: "rgba(255,59,92,0.1)", border: "1px solid rgba(255,59,92,0.3)",
                        color: "#ff3b5c", fontSize: "14px", marginBottom: "24px", fontWeight: 500
                    }}>
                        ⚠ {error}
                    </div>
                )}

                {/* ── Success ───────────────────────────────── */}
                {status === "done" && (
                    <div style={{
                        padding: "16px", borderRadius: "12px",
                        background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
                        color: "#22c55e", fontSize: "14px", marginBottom: "24px", fontWeight: 500
                    }}>
                        ✅ Video successfully scheduled! Redirecting to dashboard…
                    </div>
                )}

                {/* ── Submit ────────────────────────────────── */}
                <button
                    type="submit" className="btn-primary"
                    disabled={status === "saving"}
                    style={{ width: "100%", opacity: status === "saving" ? 0.7 : 1, fontSize: "16px", padding: "16px", marginTop: "16px", cursor: status === "saving" ? "not-allowed" : "pointer" }}
                >
                    {status === "saving" ? "Saving Schedule…" : "🚀 Schedule Video"}
                </button>
            </form>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
            <label style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>
                {label}
            </label>
            {children}
        </div>
    );
}

const inputStyle: React.CSSProperties = {
    width: "100%", padding: "14px 16px",
    borderRadius: "12px", border: "1px solid var(--border)",
    background: "var(--surface-2)", color: "var(--text)",
    fontSize: "15px", outline: "none", boxSizing: "border-box",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease"
};

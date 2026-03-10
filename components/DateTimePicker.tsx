"use client";

import { useState, useRef, useEffect } from "react";

/* ─── DatePicker ──────────────────────────────────── */

interface DatePickerProps {
    value: string; // YYYY-MM-DD
    onChange: (value: string) => void;
    min?: string; // YYYY-MM-DD
    placeholder?: string;
    id?: string;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function DatePicker({ value, onChange, min, placeholder = "Pick a date", id }: DatePickerProps) {
    const [open, setOpen] = useState(false);
    const [viewYear, setViewYear] = useState(() => value ? new Date(value + "T00:00").getFullYear() : new Date().getFullYear());
    const [viewMonth, setViewMonth] = useState(() => value ? new Date(value + "T00:00").getMonth() : new Date().getMonth());
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handle = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handle);
        return () => document.removeEventListener("mousedown", handle);
    }, [open]);

    useEffect(() => {
        if (value) {
            const d = new Date(value + "T00:00");
            setViewYear(d.getFullYear());
            setViewMonth(d.getMonth());
        }
    }, [value]);

    const minDate = min ? new Date(min + "T00:00") : (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();

    const prevMonth = () => viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y - 1)) : setViewMonth(m => m - 1);
    const nextMonth = () => viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y + 1)) : setViewMonth(m => m + 1);

    const selectDay = (day: number) => {
        const d = new Date(viewYear, viewMonth, day);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        onChange(`${yyyy}-${mm}-${dd}`);
        setOpen(false);
    };

    const isSelected = (day: number) => {
        if (!value) return false;
        const d = new Date(value + "T00:00");
        return d.getFullYear() === viewYear && d.getMonth() === viewMonth && d.getDate() === day;
    };
    const isToday = (day: number) => {
        const t = new Date();
        return t.getFullYear() === viewYear && t.getMonth() === viewMonth && t.getDate() === day;
    };
    const isDisabled = (day: number) => new Date(viewYear, viewMonth, day) < minDate;

    const displayValue = value
        ? new Date(value + "T00:00").toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "long", day: "numeric" })
        : "";

    return (
        <div ref={containerRef} className="relative" id={id}>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl border text-left bg-[var(--surface)] cursor-pointer
                    ${value ? "border-[var(--text)]/30" : "border-[var(--border-solid)]"}
                    hover:border-[var(--text)]/50
                    ${open ? "border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900/30" : ""}
                `}
            >
                <svg className="w-4 h-4 text-[var(--muted)] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                <span className={`flex-1 text-sm ${value ? "text-[var(--text)] font-medium" : "text-[var(--muted)]"}`}>
                    {displayValue || placeholder}
                </span>
                <svg className={`w-4 h-4 text-[var(--muted)] ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown calendar */}
            <div
                className={`absolute top-full left-0 mt-2 z-50 ease-out origin-top-left
                    ${open ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 -translate-y-1 pointer-events-none"}
                `}
            >
                <div className="bg-[var(--surface)] border border-[var(--border-solid)] rounded-2xl shadow-2xl overflow-hidden w-[300px]">
                    {/* Month nav */}
                    <div className="flex items-center justify-between px-4 pt-4 pb-2">
                        <button type="button" onClick={prevMonth} className="p-2 rounded-full hover:bg-[var(--surface-2)] text-[var(--text)]">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <span className="font-semibold text-sm text-[var(--text)]">{MONTHS[viewMonth]} {viewYear}</span>
                        <button type="button" onClick={nextMonth} className="p-2 rounded-full hover:bg-[var(--surface-2)] text-[var(--text)]">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>

                    {/* Day-of-week headers */}
                    <div className="grid grid-cols-7 px-3 pb-1">
                        {DAY_LABELS.map(d => (
                            <div key={d} className="text-center text-[10px] font-bold text-[var(--muted)] py-1 uppercase tracking-wide">{d}</div>
                        ))}
                    </div>

                    {/* Day grid */}
                    <div className="grid grid-cols-7 px-3 pb-4 gap-y-0.5">
                        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const sel = isSelected(day);
                            const tod = isToday(day);
                            const dis = isDisabled(day);
                            return (
                                <button
                                    key={day}
                                    type="button"
                                    disabled={dis}
                                    onClick={() => selectDay(day)}
                                    className={`w-9 h-9 mx-auto flex items-center justify-center rounded-full text-sm font-medium
                                        ${sel
                                            ? "bg-[var(--text)] text-[var(--surface)] shadow-sm"
                                            : tod
                                                ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                                                : dis
                                                    ? "text-[var(--muted)] opacity-25 cursor-not-allowed"
                                                    : "text-[var(--text)] hover:bg-[var(--surface-2)] cursor-pointer"}
                                    `}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── TimePicker ──────────────────────────────────── */

interface TimePickerProps {
    value: string; // HH:mm (24h)
    onChange: (value: string) => void;
    placeholder?: string;
    id?: string;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

export function TimePicker({ value, onChange, placeholder = "Pick a time", id }: TimePickerProps) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const parse = (v: string) => {
        if (!v) return { hour: 9, minute: 0, ampm: "AM" as const };
        const h = parseInt(v.split(":")[0]);
        const m = parseInt(v.split(":")[1]);
        return { hour: h % 12 || 12, minute: m, ampm: (h >= 12 ? "PM" : "AM") as "AM" | "PM" };
    };

    const [hour, setHour] = useState(() => parse(value).hour);
    const [minute, setMinute] = useState(() => parse(value).minute);
    const [ampm, setAmpm] = useState<"AM" | "PM">(() => parse(value).ampm);

    useEffect(() => {
        const p = parse(value);
        setHour(p.hour); setMinute(p.minute); setAmpm(p.ampm);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    useEffect(() => {
        if (!open) return;
        const handle = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handle);
        return () => document.removeEventListener("mousedown", handle);
    }, [open]);

    const emit = (h: number, m: number, ap: "AM" | "PM") => {
        let h24 = h % 12;
        if (ap === "PM") h24 += 12;
        onChange(`${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    };

    const displayValue = value ? (() => {
        const { hour: h, minute: m, ampm: ap } = parse(value);
        return `${h}:${String(m).padStart(2, "0")} ${ap}`;
    })() : "";

    return (
        <div ref={containerRef} className="relative" id={id}>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl border text-left bg-[var(--surface)] cursor-pointer
                    ${value ? "border-[var(--text)]/30" : "border-[var(--border-solid)]"}
                    hover:border-[var(--text)]/50
                    ${open ? "border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900/30" : ""}
                `}
            >
                <svg className="w-4 h-4 text-[var(--muted)] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className={`flex-1 text-sm ${value ? "text-[var(--text)] font-medium" : "text-[var(--muted)]"}`}>
                    {displayValue || placeholder}
                </span>
                <svg className={`w-4 h-4 text-[var(--muted)] ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown */}
            <div
                className={`absolute top-full left-0 mt-2 z-50 ease-out origin-top-left
                    ${open ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 -translate-y-1 pointer-events-none"}
                `}
            >
                <div className="bg-[var(--surface)] border border-[var(--border-solid)] rounded-2xl shadow-2xl p-4 w-[280px]">
                    {/* Big time display */}
                    <div className="text-center mb-4">
                        <span className="text-4xl font-light text-[var(--text)] tabular-nums tracking-tight">
                            {String(hour).padStart(2, "0")}:{String(minute).padStart(2, "0")}
                        </span>
                        <span className="text-xl font-light text-[var(--muted)] ml-2">{ampm}</span>
                    </div>

                    {/* Hours */}
                    <div className="mb-3">
                        <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mb-1.5">Hour</p>
                        <div className="grid grid-cols-6 gap-1">
                            {HOURS.map(h => (
                                <button
                                    key={h}
                                    type="button"
                                    onClick={() => { setHour(h); emit(h, minute, ampm); }}
                                    className={`py-1.5 rounded-lg text-xs font-semibold cursor-pointer
                                        ${hour === h ? "bg-[var(--text)] text-[var(--surface)]" : "text-[var(--text)] hover:bg-[var(--surface-2)]"}
                                    `}
                                >
                                    {h}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Minutes */}
                    <div className="mb-4">
                        <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mb-1.5">Minute</p>
                        <div className="grid grid-cols-6 gap-1">
                            {MINUTES.map(m => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => { setMinute(m); emit(hour, m, ampm); }}
                                    className={`py-1.5 rounded-lg text-xs font-semibold cursor-pointer
                                        ${minute === m ? "bg-[var(--text)] text-[var(--surface)]" : "text-[var(--text)] hover:bg-[var(--surface-2)]"}
                                    `}
                                >
                                    {String(m).padStart(2, "0")}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* AM / PM */}
                    <div className="flex gap-2">
                        {(["AM", "PM"] as const).map(ap => (
                            <button
                                key={ap}
                                type="button"
                                onClick={() => { setAmpm(ap); emit(hour, minute, ap); }}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer
                                    ${ampm === ap
                                        ? "bg-[var(--text)] text-[var(--surface)]"
                                        : "border border-[var(--border-solid)] text-[var(--muted)] hover:bg-[var(--surface-2)]"}
                                `}
                            >
                                {ap}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

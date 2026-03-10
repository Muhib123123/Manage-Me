"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { AlertTriangle, Info, AlertCircle } from "lucide-react";

/* ─── Types ─────────────────────────────────── */

interface ConfirmOptions {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "warning" | "info";
}

interface ConfirmContextValue {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

/* ─── Context ───────────────────────────────── */

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

/* ─── Provider ──────────────────────────────── */

export function ConfirmProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<{
        open: boolean;
        options: ConfirmOptions;
        resolve: (value: boolean) => void;
    } | null>(null);

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setState({ open: true, options, resolve });
        });
    }, []);

    const handleChoice = (value: boolean) => {
        state?.resolve(value);
        setState(null);
    };

    const variantConfig = {
        danger: {
            icon: <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-500" />,
            iconBg: "bg-red-100 dark:bg-red-500/20",
            confirmBtn: "bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-600/20",
        },
        warning: {
            icon: <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-500" />,
            iconBg: "bg-amber-100 dark:bg-amber-500/20",
            confirmBtn: "bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-500/20",
        },
        info: {
            icon: <Info className="w-6 h-6 text-blue-600 dark:text-blue-500" />,
            iconBg: "bg-blue-100 dark:bg-blue-500/20",
            confirmBtn: "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20",
        },
    };

    const v = state?.options.variant ?? "warning";
    const config = variantConfig[v];

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}

            {/* Backdrop + Modal */}
            {state && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    style={{ animation: "dialogFadeIn 0.2s ease-out" }}
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => handleChoice(false)}
                    />

                    {/* Card container */}
                    <div
                        className="relative w-full max-w-sm bg-[var(--surface)] border border-[var(--border-solid)] rounded-2xl shadow-xl overflow-hidden flex flex-col"
                        style={{ animation: "dialogSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}
                    >
                        {/* Content Area */}
                        <div className="p-6 sm:p-7">
                            <div className="flex gap-4">
                                <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${config.iconBg}`}>
                                    {config.icon}
                                </div>
                                <div className="pt-1">
                                    <h3 className="text-[17px] sm:text-lg font-semibold text-[var(--text)] leading-tight tracking-tight">
                                        {state.options.title}
                                    </h3>
                                    <p className="mt-2 text-[14px] text-[var(--muted)] leading-relaxed">
                                        {state.options.message}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Action Area */}
                        <div className="bg-[var(--surface-2)]/50 px-6 py-4 flex flex-col-reverse sm:flex-row justify-end gap-2 border-t border-[var(--border)]">
                            <button
                                onClick={() => handleChoice(false)}
                                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[var(--border-solid)] text-[14px] font-medium text-[var(--text)] bg-[var(--surface)] hover:bg-[var(--surface-2)] cursor-pointer"
                            >
                                {state.options.cancelLabel ?? "No, stay here"}
                            </button>
                            <button
                                onClick={() => handleChoice(true)}
                                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-[14px] font-semibold cursor-pointer ${config.confirmBtn}`}
                            >
                                {state.options.confirmLabel ?? "Yes, proceed"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes dialogFadeIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                @keyframes dialogSlideUp {
                    from { opacity: 0; transform: translateY(16px) scale(0.96); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </ConfirmContext.Provider>
    );
}

/* ─── Hook ──────────────────────────────────── */

export function useConfirm() {
    const ctx = useContext(ConfirmContext);
    if (!ctx) throw new Error("useConfirm must be used inside ConfirmProvider");
    return ctx.confirm;
}

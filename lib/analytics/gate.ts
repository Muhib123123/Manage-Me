import type { Plan } from "@/lib/subscription";

// ─────────────────────────────────────────────
// Analytics Freemium Gate
// ─────────────────────────────────────────────

export type AnalyticsFeature =
    | "growth-chart"    // Subscriber/follower growth over time
    | "views-chart"     // Profile view history
    | "live-counter"    // Live SSE subscriber counter
    | "gender"          // Audience gender breakdown
    | "summary-card";   // Quick summary stat cards

export type AllowedRange = "1d" | "7d" | "30d" | "90d";

export type GateResult =
    | { allowed: true; maxRange: AllowedRange }
    | { allowed: false; reason: string };

/**
 * Returns whether a given analytics feature is allowed for a plan,
 * and what the maximum date range is (for chart features).
 */
export function getAnalyticsGate(
    plan: Plan,
    feature: AnalyticsFeature
): GateResult {
    if (plan === "CREATOR") {
        return { allowed: true, maxRange: "90d" };
    }

    // FREE plan rules
    switch (feature) {
        case "live-counter":
            return {
                allowed: false,
                reason: "Live subscriber counter is a Creator feature. Upgrade to see your count update in real-time.",
            };
        case "growth-chart":
        case "views-chart":
            return {
                allowed: true,
                maxRange: "1d",
            };
        case "gender":
        case "summary-card":
            return { allowed: true, maxRange: "1d" };
        default:
            return { allowed: true, maxRange: "1d" };
    }
}

/**
 * Returns the maximum number of days of history a user can access.
 */
export function getMaxDays(plan: Plan): number {
    return plan === "CREATOR" ? 90 : 1;
}

/**
 * Validates a requested range against the plan allowance.
 * Returns the clamped range or throws a 403-ready error string.
 */
export function validateRange(
    plan: Plan,
    requested: string
): AllowedRange {
    const validRanges: AllowedRange[] = ["1d", "7d", "30d", "90d"];
    const range = validRanges.includes(requested as AllowedRange)
        ? (requested as AllowedRange)
        : "1d";

    if (plan === "FREE" && range !== "1d") {
        throw new Error(
            "Analytics history beyond 1 day requires the Creator plan. Upgrade to unlock full history."
        );
    }

    return range;
}

/**
 * Converts a range string to a Date (the start of the window).
 */
export function rangeToStartDate(range: AllowedRange): Date {
    const ms: Record<AllowedRange, number> = {
        "1d": 1 * 24 * 60 * 60 * 1000,
        "7d": 7 * 24 * 60 * 60 * 1000,
        "30d": 30 * 24 * 60 * 60 * 1000,
        "90d": 90 * 24 * 60 * 60 * 1000,
    };
    return new Date(Date.now() - ms[range]);
}

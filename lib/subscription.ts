import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────
// Plan Limits
// ─────────────────────────────────────────────

export type Plan = "FREE" | "CREATOR";

export const PLAN_LIMITS = {
  FREE: {
    maxPostsPerDayYoutube: 1,
    maxPostsPerDayInstagram: 1,
    maxPostsPerDayTiktok: 1,
    maxPostsPerMonth: 15,       // all platforms combined
    maxScheduledPosts: 15,      // pending/scheduled at any time
    scheduleHorizonDays: 7,     // can't schedule further than 7 days out
    canSwitchPlatformAccount: true, // Now allowed for Free users
  },
  CREATOR: {
    maxPostsPerDayYoutube: 1,
    maxPostsPerDayInstagram: 20,
    maxPostsPerDayTiktok: 20,
    maxPostsPerMonth: Infinity,
    maxScheduledPosts: Infinity,
    scheduleHorizonDays: 30,
    canSwitchPlatformAccount: true,
  },
} as const;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Fetch the user's current plan from DB */
export async function getUserPlan(userId: string): Promise<Plan> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });
  return (user?.plan ?? "FREE") as Plan;
}

/** Count posts published (DONE) or pending (PENDING/UPLOADING) this calendar month, all platforms */
export async function getPostCountThisMonth(userId: string): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [yt, ig, tt] = await Promise.all([
    prisma.youtubePost.count({
      where: {
        userId,
        createdAt: { gte: startOfMonth },
        status: { notIn: ["FAILED"] },
      },
    }),
    prisma.instagramPost.count({
      where: {
        userId,
        createdAt: { gte: startOfMonth },
        status: { notIn: ["FAILED"] },
      },
    }),
    prisma.tiktokPost.count({
      where: {
        userId,
        createdAt: { gte: startOfMonth },
        status: { notIn: ["FAILED"] },
      },
    }),
  ]);

  return yt + ig + tt;
}

/** Count posts scheduled or published today for a specific platform */
export async function getPostCountToday(
  userId: string,
  platform: "YOUTUBE" | "INSTAGRAM" | "TIKTOK",
  date: Date = new Date()
): Promise<number> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const filter = {
    userId,
    scheduledAt: { gte: startOfDay, lte: endOfDay },
    status: { notIn: ["FAILED"] as string[] },
  };

  if (platform === "YOUTUBE") {
    return prisma.youtubePost.count({ where: filter });
  } else if (platform === "INSTAGRAM") {
    return prisma.instagramPost.count({ where: filter });
  } else {
    return prisma.tiktokPost.count({ where: filter });
  }
}

/** Count currently scheduled (PENDING) posts across all platforms */
export async function getScheduledPostCount(userId: string): Promise<number> {
  const [yt, ig, tt] = await Promise.all([
    prisma.youtubePost.count({ where: { userId, status: "PENDING" } }),
    prisma.instagramPost.count({ where: { userId, status: "PENDING" } }),
    prisma.tiktokPost.count({ where: { userId, status: "PENDING" } }),
  ]);
  return yt + ig + tt;
}

// ─────────────────────────────────────────────
// Core Enforcement Check
// ─────────────────────────────────────────────

export type EnforcementResult =
  | { ok: true }
  | { ok: false; reason: string; code: "MONTHLY_LIMIT" | "DAILY_LIMIT" | "SCHEDULE_LIMIT" | "HORIZON_LIMIT" };

/**
 * Full plan enforcement check before creating / scheduling a post.
 * Returns { ok: true } if allowed, or { ok: false, reason, code } if blocked.
 */
export async function canSchedulePost(
  userId: string,
  platform: "YOUTUBE" | "INSTAGRAM" | "TIKTOK",
  scheduledAt: Date
): Promise<EnforcementResult> {
  const plan = await getUserPlan(userId);
  const limits = PLAN_LIMITS[plan];

  // 1. Check schedule horizon
  const now = new Date();
  const maxDate = new Date(now);
  maxDate.setDate(maxDate.getDate() + limits.scheduleHorizonDays);
  if (scheduledAt > maxDate) {
    return {
      ok: false,
      reason:
        plan === "FREE"
          ? `Free plan can only schedule up to 7 days in advance. Upgrade to Creator to schedule up to 30 days ahead.`
          : `Creator plan can schedule up to 30 days in advance.`,
      code: "HORIZON_LIMIT",
    };
  }

  // 2. Check monthly limit (FREE only)
  if (plan === "FREE") {
    const monthlyCount = await getPostCountThisMonth(userId);
    if (monthlyCount >= limits.maxPostsPerMonth) {
      return {
        ok: false,
        reason: `You've reached your 15-post monthly limit on the Free plan. Upgrade to Creator for unlimited posts.`,
        code: "MONTHLY_LIMIT",
      };
    }
  }

  // 3. Check scheduled posts limit (FREE only)
  if (plan === "FREE" && limits.maxScheduledPosts !== Infinity) {
    const scheduledCount = await getScheduledPostCount(userId);
    if (scheduledCount >= limits.maxScheduledPosts) {
      return {
        ok: false,
        reason: `Free plan allows up to 15 scheduled posts at a time. Upgrade to Creator for unlimited scheduling.`,
        code: "SCHEDULE_LIMIT",
      };
    }
  }

  // 4. Check daily limit per platform
  const dayMap: Record<string, number> = {
    YOUTUBE: limits.maxPostsPerDayYoutube,
    INSTAGRAM: limits.maxPostsPerDayInstagram,
    TIKTOK: limits.maxPostsPerDayTiktok,
  };
  const maxPerDay = dayMap[platform];
  const todayCount = await getPostCountToday(userId, platform, scheduledAt);
  if (todayCount >= maxPerDay) {
    const platformLabel =
      platform === "YOUTUBE" ? "YouTube" : platform === "INSTAGRAM" ? "Instagram" : "TikTok";
    if (plan === "FREE") {
      return {
        ok: false,
        reason: `Free plan allows 1 ${platformLabel} post per day. Upgrade to Creator for higher limits.`,
        code: "DAILY_LIMIT",
      };
    } else {
      return {
        ok: false,
        reason: `Creator plan allows up to ${maxPerDay} ${platformLabel} posts per day.`,
        code: "DAILY_LIMIT",
      };
    }
  }

  return { ok: true };
}

// ─────────────────────────────────────────────
// EU Country Detection (for pricing display)
// ─────────────────────────────────────────────

const EU_LOCALES = new Set([
  "de", "fr", "es", "it", "pt", "nl", "pl", "sv", "da", "fi",
  "nb", "el", "cs", "sk", "hu", "ro", "bg", "hr", "sl", "lt",
  "lv", "et", "mt", "ga", "lb", "mk", "sq", "sr", "bs",
]);

/** Check if a browser locale string suggests an EU country (client-side only) */
export function isEULocale(locale: string): boolean {
  const lang = locale.split("-")[0].toLowerCase();
  const region = locale.split("-")[1]?.toUpperCase();

  // Check specific region codes first
  const EU_REGIONS = new Set([
    "DE","FR","ES","IT","PT","NL","PL","SE","DK","FI","NO","GR","CZ","SK",
    "HU","RO","BG","HR","SI","LT","LV","EE","MT","IE","LU","AT","BE","CY",
  ]);
  if (region && EU_REGIONS.has(region)) return true;

  return EU_LOCALES.has(lang);
}

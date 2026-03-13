import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY!;
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET!;
const REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI || `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/tiktok/callback`;
const APP_BASE = process.env.NEXTAUTH_URL || "http://localhost:3000";

export async function GET(req: NextRequest) {
    // NOTE: We intentionally do NOT call auth() here.
    // The callback is accessed via the Cloudflare tunnel domain, so the
    // NextAuth session cookie (set on localhost:3000) is never sent.
    // Instead we trust the signed `state` param which carries the userId.

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
        console.error("TikTok OAuth error:", error);
        return NextResponse.redirect(new URL(`/connect?error=${encodeURIComponent(error)}`, APP_BASE));
    }

    if (!code || !state) {
        return NextResponse.redirect(new URL("/connect?error=invalid_request", APP_BASE));
    }

    try {
        // Decode state → { userId, cv: codeVerifier }
        const parsedState = JSON.parse(Buffer.from(state, "base64url").toString("utf-8"));
        const userId = parsedState.userId as string | undefined;
        const codeVerifier = parsedState.cv as string | undefined;

        if (!userId) throw new Error("Missing userId in state");
        if (!codeVerifier) throw new Error("Missing code_verifier in state — please try connecting again");

        // Verify the user exists in our DB
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error("User not found");

        // Exchange code for access + refresh tokens
        const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_key: TIKTOK_CLIENT_KEY,
                client_secret: TIKTOK_CLIENT_SECRET,
                code,
                grant_type: "authorization_code",
                redirect_uri: REDIRECT_URI,
                code_verifier: codeVerifier,
            }).toString(),
        });

        if (!tokenRes.ok) {
            const errText = await tokenRes.text();
            throw new Error(`Token exchange failed: ${errText}`);
        }

        const tokenData = await tokenRes.json();
        const { access_token, refresh_token, expires_in, open_id } = tokenData;

        if (!access_token) {
            throw new Error(`No access_token in TikTok response: ${JSON.stringify(tokenData)}`);
        }

        // Fetch user info (display name + avatar)
        const userRes = await fetch(
            "https://open.tiktokapis.com/v2/user/info/?fields=display_name,avatar_url",
            { headers: { Authorization: `Bearer ${access_token}` } }
        );

        let platformName = "TikTok Account";
        let platformAvatar = "";

        if (userRes.ok) {
            const userData = await userRes.json();
            const userInfo = userData?.data?.user;
            if (userInfo) {
                platformName = userInfo.display_name || platformName;
                platformAvatar = userInfo.avatar_url || "";
            }
        }

        const expiresAt = expires_in
            ? new Date(Date.now() + expires_in * 1000)
            : new Date(Date.now() + 86_400_000);

        // Upsert PlatformConnection
        await prisma.platformConnection.upsert({
            where: { userId_platform: { userId, platform: "TIKTOK" } },
            create: {
                userId,
                platform: "TIKTOK",
                accessToken: access_token,
                refreshToken: refresh_token ?? null,
                expiresAt,
                platformId: open_id ?? null,
                platformName,
                platformAvatar,
            },
            update: {
                accessToken: access_token,
                ...(refresh_token && { refreshToken: refresh_token }),
                expiresAt,
                platformId: open_id ?? null,
                platformName,
                platformAvatar,
            },
        });

        return NextResponse.redirect(new URL("/tiktok-dashboard?success=TikTok", APP_BASE));
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("TikTok callback error:", message);
        return NextResponse.redirect(
            new URL(`/connect?error=${encodeURIComponent(message)}`, APP_BASE)
        );
    }
}

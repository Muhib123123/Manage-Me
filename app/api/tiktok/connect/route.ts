import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";

const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY!;
const APP_BASE = (process.env.NEXTAUTH_URL || "http://localhost:3000").trim().replace(/\/$/, "");
const REDIRECT_URI = `${APP_BASE}/api/tiktok/callback`;

function generateCodeVerifier(): string {
    return randomBytes(48).toString("base64url");
}

function generateCodeChallenge(verifier: string): string {
    return createHash("sha256").update(verifier).digest("base64url");
}

export async function GET() {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    // Encode both userId AND code_verifier in state so the callback can read it.
    // We can't use a cookie here because the callback comes via trycloudflare.com
    // (a different domain than localhost), so the browser won't send the cookie.
    const state = Buffer.from(
        JSON.stringify({ userId: session.user.id, cv: codeVerifier })
    ).toString("base64url");

    const params = new URLSearchParams({
        client_key: TIKTOK_CLIENT_KEY,
        response_type: "code",
        scope: "user.info.basic,user.info.stats,video.publish",
        redirect_uri: REDIRECT_URI,
        state,
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
    });

    const authUrl = `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;

    return NextResponse.redirect(authUrl);
}

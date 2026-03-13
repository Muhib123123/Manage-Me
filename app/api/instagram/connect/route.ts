import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth();

    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // We manually construct the Facebook OAuth URL to ensure we request the explicit scopes needed for Instagram Graph API.
    // We also use `state` to prevent CSRF.

    const clientId = process.env.INSTAGRAM_CLIENT_ID || process.env.AUTH_FACEBOOK_ID;

    // Direct Instagram Login callback
    const baseUrl = (process.env.NEXTAUTH_URL || "http://localhost:3000").trim().replace(/\/$/, "");
    const redirectUri = `${baseUrl}/api/instagram/callback`;

    // Permissions for direct Instagram Professional login (Content Publishing)
    const scopes = [
        "instagram_business_basic",
        "instagram_business_content_publish",
        "instagram_business_manage_insights",
        "instagram_business_manage_comments"
    ].join(",");

    const authUrl = new URL("https://www.instagram.com/oauth/authorize");
    authUrl.searchParams.append("client_id", clientId!);
    authUrl.searchParams.append("redirect_uri", redirectUri);
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("scope", scopes);

    return NextResponse.redirect(authUrl.toString());
}

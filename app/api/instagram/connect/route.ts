import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth();

    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // We manually construct the Facebook OAuth URL to ensure we request the explicit scopes needed for Instagram Graph API.
    // We also use `state` to prevent CSRF.

    const clientId = process.env.AUTH_FACEBOOK_ID;

    // The redirect URI must match exactly what is in the App Dashboard (and the standard NextAuth callback)
    const redirectUri = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/callback/facebook`;

    // The scopes required to publish to Instagram via the Graph API
    const scopes = [
        "instagram_basic",
        "instagram_content_publish",
        "pages_show_list",
        "pages_read_engagement",
        "business_management"
    ].join(",");

    const authUrl = new URL("https://www.facebook.com/v19.0/dialog/oauth");
    authUrl.searchParams.append("client_id", clientId!);
    authUrl.searchParams.append("redirect_uri", redirectUri);
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("scope", scopes);
    // Explicitly ask for consent to ensure we get a long-lived token
    authUrl.searchParams.append("auth_type", "rerequest");

    return NextResponse.redirect(authUrl.toString());
}

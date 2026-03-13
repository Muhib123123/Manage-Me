import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await auth();

    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const baseUrl = (process.env.NEXTAUTH_URL || "http://localhost:3000").trim().replace(/\/$/, "");
    const redirectUri = `${baseUrl}/api/instagram/callback`;

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const error_description = searchParams.get("error_description");

    if (error) {
        console.error("Instagram Direct Auth Error:", error_description);
        return NextResponse.redirect(new URL(`${baseUrl}/connect?error=${encodeURIComponent(error_description || "Authentication failed")}`));
    }

    if (!code) {
        return NextResponse.redirect(new URL(`${baseUrl}/connect?error=No+authorization+code+provided`));
    }

    const clientId = process.env.INSTAGRAM_CLIENT_ID || process.env.AUTH_FACEBOOK_ID!;
    const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET || process.env.AUTH_FACEBOOK_SECRET!;


    try {
        // 1. Exchange the code for a short-lived access token
        // Use the dedicated Instagram OAuth endpoint
        const formData = new URLSearchParams();
        formData.append("client_id", clientId);
        formData.append("client_secret", clientSecret);
        formData.append("grant_type", "authorization_code");
        formData.append("redirect_uri", redirectUri);
        formData.append("code", code);

        const tokenResponse = await fetch(`https://api.instagram.com/oauth/access_token`, {
            method: "POST",
            body: formData,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });
        const tokenData = await tokenResponse.json();

        if (tokenData.error_message || tokenData.error) {
            throw new Error(tokenData.error_message || tokenData.error.message || "Token exchange failed");
        }

        let accessToken = tokenData.access_token;

        // 2. Exchange short-lived token for a long-lived token (60 days)
        // For Instagram Professional, use the ig_exchange_token grant type
        const longTokenResponse = await fetch(`https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${accessToken}`);
        const longTokenData = await longTokenResponse.json();

        if (!longTokenData.error && longTokenData.access_token) {
            accessToken = longTokenData.access_token;
        }

        // 3. Fetch the Instagram User details directly
        // Use the Instagram Graph API endpoint
        const igUserResponse = await fetch(`https://graph.instagram.com/v19.0/me?fields=id,username,profile_picture_url&access_token=${accessToken}`);
        const igUserData = await igUserResponse.json();

        if (igUserData.error) {
            // If direct /me fails, it might be because the token is for a Facebook User
            // In the "direct" flow, the token should represent the Instagram user.
            throw new Error(`Failed to fetch Instagram profile: ${igUserData.error.message}`);
        }

        const instagramAccountId = igUserData.id;
        const instagramUsername = igUserData.username;
        const instagramAvatar = igUserData.profile_picture_url;

        if (!instagramAccountId) {
            throw new Error("Could not identify the Instagram Professional account.");
        }

        // 4. Calculate expiration date for the token
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 60);

        // 5. Save or update PlatformConnection in our local DB
        await prisma.platformConnection.upsert({
            where: {
                userId_platform: {
                    userId: session.user.id,
                    platform: "INSTAGRAM",
                },
            },
            update: {
                accessToken,
                refreshToken: null,
                expiresAt,
                platformId: instagramAccountId,
                platformName: instagramUsername || "Instagram Account",
                platformAvatar: instagramAvatar
            },
            create: {
                userId: session.user.id,
                platform: "INSTAGRAM",
                accessToken,
                expiresAt,
                platformId: instagramAccountId,
                platformName: instagramUsername || "Instagram Account",
                platformAvatar: instagramAvatar
            },
        });

        return NextResponse.redirect(new URL(`/instagram-dashboard?success=Instagram`, baseUrl));

    } catch (err: any) {
        console.error("Error setting up direct Instagram connection:", err);
        return NextResponse.redirect(new URL(`${baseUrl}/connect?error=${encodeURIComponent(err.message || "Failed to connect to Instagram")}`));
    }
}

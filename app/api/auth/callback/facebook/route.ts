import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await auth();

    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const error_description = searchParams.get("error_description");

    if (error) {
        console.error("Facebook Auth Error:", error_description);
        return NextResponse.redirect(new URL(`/connect?error=${encodeURIComponent(error_description || "Authentication failed")}`, req.url));
    }

    if (!code) {
        return NextResponse.redirect(new URL(`/connect?error=No+authorization+code+provided`, req.url));
    }

    const clientId = process.env.AUTH_FACEBOOK_ID!;
    const clientSecret = process.env.AUTH_FACEBOOK_SECRET!;
    const redirectUri = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/callback/facebook`;

    try {
        // 1. Exchange the code for a short-lived access token
        const tokenResponse = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${clientId}&redirect_uri=${redirectUri}&client_secret=${clientSecret}&code=${code}`);
        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            throw new Error(tokenData.error.message);
        }

        let accessToken = tokenData.access_token;

        // 2. Exchange short-lived token for a long-lived token (60 days)
        const longTokenResponse = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${accessToken}`);

        const longTokenData = await longTokenResponse.json();

        if (!longTokenData.error && longTokenData.access_token) {
            accessToken = longTokenData.access_token;
        }

        // 3. Find the user's Facebook Pages
        const pagesResponse = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`);
        const pagesData = await pagesResponse.json();

        console.log("--- FACEBOOK API DEBUG ---");
        console.log("Pages Data Response:", JSON.stringify(pagesData, null, 2));
        console.log("--------------------------");

        if (pagesData.error) {
            throw new Error(pagesData.error.message);
        }

        if (!pagesData.data || pagesData.data.length === 0) {
            throw new Error("No Facebook Pages found. You must link your Instagram to a Facebook Page.");
        }

        let instagramAccountId = null;
        let instagramUsername = null;
        let instagramAvatar = null;

        // 4. Find the first page that has an Instagram Business Account linked
        for (const page of pagesData.data) {
            const igResponse = await fetch(`https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${accessToken}`);
            const igData = await igResponse.json();

            if (igData.instagram_business_account) {
                instagramAccountId = igData.instagram_business_account.id;

                // Get the Instagram username and profile picture
                const igProfileResponse = await fetch(`https://graph.facebook.com/v19.0/${instagramAccountId}?fields=username,profile_picture_url&access_token=${accessToken}`);
                const igProfileData = await igProfileResponse.json();

                if (igProfileData.username) {
                    instagramUsername = igProfileData.username;
                    instagramAvatar = igProfileData.profile_picture_url;
                }
                break;
            }
        }

        if (!instagramAccountId) {
            throw new Error("No Instagram Business or Creator account found linked to your Facebook Pages.");
        }

        // 5. Calculate expiration date for the token (Long-lived tokens technically last 60 days)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 60);

        // 6. Save or update PlatformConnection in our local DB
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

        // 7. Successful redirect back to the hub
        return NextResponse.redirect(new URL(`/instagram-dashboard?success=Instagram`, req.url));

    } catch (err: any) {
        console.error("Error setting up Instagram connection:", err);
        return NextResponse.redirect(new URL(`/connect?error=${encodeURIComponent(err.message || "Failed to connect to Instagram")}`, req.url));
    }
}

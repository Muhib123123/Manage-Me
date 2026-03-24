import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { scheduleAnalyticsSync } from "@/lib/analytics/queue";

const APP_BASE = (process.env.NEXTAUTH_URL || "http://localhost:3000").trim().replace(/\/$/, "");

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session) {
        return NextResponse.redirect(new URL("/login", APP_BASE));
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
        console.error("YouTube OAuth error:", error);
        return NextResponse.redirect(new URL("/youtube-dashboard?error=youtube_auth_failed", APP_BASE));
    }

    if (!code || !state) {
        return NextResponse.redirect(new URL("/youtube-dashboard?error=invalid_request", APP_BASE));
    }

    try {
        // Parse state to ensure we are applying this to the correct user
        // (Though NextAuth session also protects us here)
        const parsedState = JSON.parse(Buffer.from(state, "base64").toString("utf-8"));
        if (parsedState.userId !== session.user.id) {
            throw new Error("State mismatch");
        }

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/youtube/callback`
        );

        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Fetch user's YouTube Channel info to get their avatar and name
        const youtube = google.youtube({ version: "v3", auth: oauth2Client });
        const channelRes = await youtube.channels.list({
            part: ["snippet"],
            mine: true,
        });

        const channel = channelRes.data.items?.[0];
        let platformId = "";
        let platformName = "YouTube Channel";
        let platformAvatar = "";

        if (channel && channel.snippet) {
            platformId = channel.id || "";
            platformName = channel.snippet.title || platformName;
            platformAvatar = channel.snippet.thumbnails?.default?.url || "";
        }

        // Save or update the connection in DB
        await prisma.platformConnection.upsert({
            where: {
                userId_platform: {
                    userId: session.user.id,
                    platform: "YOUTUBE",
                },
            },
            create: {
                userId: session.user.id,
                platform: "YOUTUBE",
                accessToken: tokens.access_token!,
                refreshToken: tokens.refresh_token,
                expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
                platformId,
                platformName,
                platformAvatar,
            },
            update: {
                accessToken: tokens.access_token!,
                // Only update refresh token if we got a new one (sometimes Google doesn't send it again)
                ...(tokens.refresh_token && { refreshToken: tokens.refresh_token }),
                expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
                platformId,
                platformName,
                platformAvatar,
            },
        });

        // Schedule recurring analytics snapshots for this user
        await scheduleAnalyticsSync(session.user.id, "YOUTUBE").catch(console.error);

        // Redirect back to the connections hub
        return NextResponse.redirect(new URL("/youtube-dashboard?success=youtube", APP_BASE));
    } catch (err: any) {
        console.error("Failed to exchange YouTube token:", err);
        return NextResponse.redirect(new URL("/connect?error=youtube_exchange_failed", APP_BASE));
    }
}

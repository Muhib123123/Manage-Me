import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    // Redirect back to our callback route
    `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/youtube/callback`
);

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate a secure random state string, but store the userId
    // so we can associate the token with the right user upon callback
    // In production, you'd want to sign this or store it in an HttpOnly cookie
    const state = Buffer.from(JSON.stringify({ userId: session.user.id })).toString("base64");

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent select_account", // Force consent screen and account selection
        scope: [
            "https://www.googleapis.com/auth/youtube.upload",
            "https://www.googleapis.com/auth/youtube.readonly"
        ],
        state,
    });

    // Instead of throwing an error or JSON, we redirect the browser to the Google Auth screen
    return NextResponse.redirect(authUrl);
}

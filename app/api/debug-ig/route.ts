import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// TEMP DEBUG - DELETE AFTER USE
export async function GET() {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "not authed" }, { status: 401 });

    const conn = await prisma.platformConnection.findUnique({
        where: { userId_platform: { userId: session.user.id, platform: "INSTAGRAM" } },
        select: { platformName: true, platformId: true, accessToken: true, expiresAt: true, updatedAt: true }
    });

    if (!conn) return NextResponse.json({ found: false });

    const tok = conn.accessToken || "";
    return NextResponse.json({
        found: true,
        name: conn.platformName,
        platformId: conn.platformId,
        expiresAt: conn.expiresAt,
        updatedAt: conn.updatedAt,
        tokenLength: tok.length,
        tokenPrefix: tok.slice(0, 40),
        startsIG: tok.startsWith("IG"),
        startsEAA: tok.startsWith("EAA"),
        hasNewline: tok.includes("\n"),
        hasSpace: tok.includes(" "),
    });
}

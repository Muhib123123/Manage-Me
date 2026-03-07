import { auth } from "@/lib/auth";
import { getValidTikTokToken } from "@/lib/tiktok";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) return new NextResponse(`<html><body><h1>Unauthorized</h1></body></html>`, { headers: { 'Content-Type': 'text/html' } });

        const accessToken = await getValidTikTokToken(session.user.id);

        const res = await fetch("https://open.tiktokapis.com/v2/post/publish/creator_info/query/", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json; charset=UTF-8",
            },
            body: JSON.stringify({}),
        });

        const data = await res.json();
        const jsonStr = JSON.stringify(data, null, 2);

        return new NextResponse(`<html><body><pre>${jsonStr}</pre></body></html>`, { headers: { 'Content-Type': 'text/html' } });
    } catch (e: any) {
        return new NextResponse(`<html><body><h1>Error: ${e.message}</h1></body></html>`, { headers: { 'Content-Type': 'text/html' } });
    }
}

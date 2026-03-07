import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");

    if (!url) {
        return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
    }

    try {
        const dlUrl = url.includes("utfs.io") || url.includes("uploadthing.com")
            ? `${url}?download=1`
            : url;

        const response = await fetch(dlUrl);

        if (!response.ok) {
            return NextResponse.json({ error: "Failed to fetch video" }, { status: response.status });
        }

        const headers = new Headers();
        headers.set("Content-Type", response.headers.get("Content-Type") || "video/mp4");
        headers.set("Content-Length", response.headers.get("Content-Length") || "");
        headers.set("Cache-Control", "public, max-age=31536000"); // 1 year

        return new NextResponse(response.body, {
            status: 200,
            headers,
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

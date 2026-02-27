import { auth } from "@/lib/auth";
import { generateUploadUrl } from "@/lib/storage";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { filename, contentType, fileType } = await req.json();

    if (!filename || !contentType) {
        return NextResponse.json({ error: "Missing filename or contentType" }, { status: 400 });
    }

    // Build a unique storage key using the user's ID to avoid collisions
    const ext = filename.split(".").pop();
    const folder = fileType === "thumbnail" ? "thumbnails" : "videos";
    const key = `${folder}/${session.user.id}/${uuid()}.${ext}`;

    const { uploadUrl, fileUrl } = await generateUploadUrl(key, contentType);

    return NextResponse.json({ uploadUrl, fileUrl });
}

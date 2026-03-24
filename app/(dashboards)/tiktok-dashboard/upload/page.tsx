import { Metadata } from "next";
export const metadata: Metadata = { title: "Upload to TikTok" };

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TikTokUploadFormClient from "./UploadFormClient";

export default async function TikTokUploadPage() {
    const session = await auth();
    if (!session) redirect("/login");

    const ttConnection = await prisma.platformConnection.findUnique({
        where: {
            userId_platform: { userId: session.user.id, platform: "TIKTOK" },
        },
    });

    if (!ttConnection) {
        redirect("/dashboard?error=Please connect your TikTok account first.");
    }

    return <TikTokUploadFormClient accountName={ttConnection.platformName || "your account"} />;
}

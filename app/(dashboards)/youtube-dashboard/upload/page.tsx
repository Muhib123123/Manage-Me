import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import UploadForm from "./UploadFormClient";

export default async function UploadPage() {
    const session = await auth();
    if (!session) redirect("/login");

    const ytConnection = await prisma.platformConnection.findUnique({
        where: {
            userId_platform: { userId: session.user.id, platform: "YOUTUBE" },
        },
    });

    if (!ytConnection) {
        redirect("/dashboard?error=Please connect your YouTube account first.");
    }

    return <UploadForm channelName={ytConnection.platformName || "your channel"} />;
}

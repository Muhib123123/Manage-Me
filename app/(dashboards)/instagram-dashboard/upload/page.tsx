import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import InstagramUploadFormClient from "./UploadFormClient";

export default async function InstagramUploadPage() {
    const session = await auth();
    if (!session) redirect("/login");

    const igConnection = await prisma.platformConnection.findUnique({
        where: {
            userId_platform: { userId: session.user.id, platform: "INSTAGRAM" },
        },
    });

    if (!igConnection) {
        redirect("/dashboard?error=Please connect your Instagram account first.");
    }

    return <InstagramUploadFormClient accountName={igConnection.platformName || "your account"} />;
}

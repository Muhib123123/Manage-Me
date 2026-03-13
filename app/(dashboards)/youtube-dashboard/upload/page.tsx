import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkLongUploadStatus } from "@/lib/youtube";
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

    let isPhoneVerified = false;
    try {
        isPhoneVerified = await checkLongUploadStatus(session.user.id);
    } catch (error: any) {
        if (error.message === "invalid_grant") {
            redirect("/youtube-dashboard?error=Your YouTube connection has expired. Please re-connect your account.");
        }
        // For other errors, we just treat them as false (not phone verified) or ignore
        console.error("Error checking long upload status in page:", error);
    }

    return <UploadForm channelName={ytConnection.platformName || "your channel"} isPhoneVerified={isPhoneVerified} />;
}

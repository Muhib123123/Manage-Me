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
        return (
            <div className="p-6 max-w-2xl mx-auto mt-10">
                <div className="bg-[var(--surface)] border border-[var(--border-solid)] rounded-2xl p-8 shadow-[var(--shadow-sm)] flex flex-col items-center justify-center text-center gap-4">
                    <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center text-3xl mb-2">
                        🎬
                    </div>
                    <h1 className="text-2xl font-bold">YouTube Not Connected</h1>
                    <p className="text-[var(--muted)] text-sm max-w-md">
                        You need to connect your YouTube account before you can schedule and upload videos.
                    </p>
                    <Link
                        href="/dashboard/connect"
                        className="mt-4 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors"
                    >
                        Go to Connections
                    </Link>
                </div>
            </div>
        );
    }

    return <UploadForm channelName={ytConnection.platformName || "your channel"} />;
}

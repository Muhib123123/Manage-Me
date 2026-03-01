import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { InstagramUploadForm } from "./InstagramUploadForm";

export default async function InstagramUploadPage() {
    const session = await auth();
    if (!session) redirect("/login");

    const igConnection = await prisma.platformConnection.findUnique({
        where: {
            userId_platform: { userId: session.user.id, platform: "INSTAGRAM" },
        },
    });

    if (!igConnection) {
        return (
            <div className="p-6 max-w-2xl mx-auto mt-10">
                <div className="bg-[var(--surface)] border border-[var(--border-solid)] rounded-2xl p-8 shadow-[var(--shadow-sm)] flex flex-col items-center justify-center text-center gap-4">
                    <div className="w-16 h-16 bg-fuchsia-50 text-fuchsia-600 rounded-full flex items-center justify-center text-3xl mb-2">
                        📸
                    </div>
                    <h1 className="text-2xl font-bold">Instagram Not Connected</h1>
                    <p className="text-[var(--muted)] text-sm max-w-md">
                        You need to connect your Instagram Professional account before you can schedule photos and videos.
                    </p>
                    <Link
                        href="/dashboard/connect"
                        className="mt-4 px-6 py-3 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold rounded-xl transition-colors"
                    >
                        Go to Connections
                    </Link>
                </div>
            </div>
        );
    }

    return <InstagramUploadForm />;
}

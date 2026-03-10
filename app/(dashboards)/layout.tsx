import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    if (!session) redirect("/login");

    const connections = await prisma.platformConnection.findMany({
        where: { userId: session.user.id }
    });
    const connectedPlatforms = connections.map(c => c.platform);

    return <DashboardShell user={session.user} connections={connectedPlatforms}>{children}</DashboardShell>;
}

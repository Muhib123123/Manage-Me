import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // This will inherently cascade-delete all accounts, sessions, posts, 
    // analytics, platform connections, and live views due to the Prisma schema onDelete hooks.
    await prisma.user.delete({
      where: {
        id: session.user.id,
      },
    });

    return NextResponse.json({ success: true, message: "Account entirely deleted." });
  } catch (error) {
    console.error("[USER_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

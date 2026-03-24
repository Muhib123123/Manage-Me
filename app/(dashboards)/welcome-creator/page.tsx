import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getUserPlan } from "@/lib/subscription";
import { redirect } from "next/navigation";
import WelcomeCreatorClient from "./WelcomeCreatorClient";

export const metadata: Metadata = {
    title: "Welcome to Creator",
};

export default async function WelcomeCreatorPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    const plan = await getUserPlan(session.user.id);

    // Completely block access to free users on the server-side
    // by triggering an instant 307 redirect away from the page
    if (plan !== "CREATOR") {
        redirect("/dashboard");
    }

    // Only creator plan users will receive the rendered animation HTML
    return <WelcomeCreatorClient />;
}

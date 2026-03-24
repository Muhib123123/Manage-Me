import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
    title: "Terms of Service",
    description: "Manage Me Terms of Service",
};

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[var(--surface)] text-[var(--text)]">
            <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
                <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--text)] transition-colors mb-10">
                    <ArrowLeft size={16} /> Back to Application
                </Link>
                
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Terms of Service</h1>
                <p className="text-[var(--muted)] mb-12">Last updated: {new Date().toLocaleDateString()}</p>

                <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                    
                    <section>
                        <h2 className="text-2xl font-bold border-b border-[var(--border-solid)] pb-2 mb-4">1. Agreement to Terms</h2>
                        <p className="leading-relaxed text-[var(--muted)]">
                            By accessing or using the Manage Me application, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold border-b border-[var(--border-solid)] pb-2 mb-4">2. Description of Service</h2>
                        <p className="leading-relaxed text-[var(--muted)]">
                            Manage Me is an automated social media scheduling tool that allows users to upload media (videos, photos) and schedule them to be published automatically to third-party platforms (YouTube, Instagram, TikTok) on their behalf using official Developer APIs.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold border-b border-[var(--border-solid)] pb-2 mb-4">3. Third-Party Platform Terms</h2>
                        <p className="leading-relaxed text-[var(--muted)] mb-4">
                            Manage Me acts as a bridge to third-party social networks. As a result, you must agree to the Terms of Service of the respective platforms you connect to our application:
                        </p>
                        <ul className="list-disc pl-5 text-[var(--muted)] space-y-2">
                            <li><strong>YouTube:</strong> By connecting your YouTube account, you agree to be bound by the <a href="https://www.youtube.com/t/terms" className="text-blue-500 hover:underline" target="_blank" rel="noreferrer">YouTube Terms of Service</a>.</li>
                            <li><strong>Instagram / Meta:</strong> By utilizing the Instagram integration, you are subject to the <a href="https://help.instagram.com/581066165581870" className="text-blue-500 hover:underline" target="_blank" rel="noreferrer">Instagram Terms of Use</a>.</li>
                            <li><strong>TikTok:</strong> Content published to TikTok is bound by the <a href="https://www.tiktok.com/legal/terms-of-service" className="text-blue-500 hover:underline" target="_blank" rel="noreferrer">TikTok Terms of Service</a>.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold border-b border-[var(--border-solid)] pb-2 mb-4">4. User Content and Conduct</h2>
                        <ul className="list-disc pl-5 text-[var(--muted)] space-y-2">
                            <li>You are solely responsible for the content, text, data, graphics, and videos that you upload to Manage Me and schedule for publishing.</li>
                            <li>You agree not to upload any content that is illegal, abusive, sexually explicit, harmful, or violates the copyrights or trademarks of others.</li>
                            <li>We reserve the right to ban or terminate accounts that frequently fail API compliance checks or attempt to misuse the background job queuing mechanism.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold border-b border-[var(--border-solid)] pb-2 mb-4">5. API Rate Limiting and Service Availability</h2>
                        <p className="leading-relaxed text-[var(--muted)] mb-2">
                            Manage Me operates subject to the API Quotas assigned to us by external platforms (like the YouTube API Quota limit). 
                        </p>
                        <ul className="list-disc pl-5 text-[var(--muted)] space-y-2">
                            <li>While we strive for 99.9% uptime, we do not guarantee that posts will be published at the exact millisecond scheduled, as factors like binary file-size upload times, Meta container polling delays, and target rate limits may introduce minor delays.</li>
                            <li>We reserve the right to throttle user uploads if daily quota caps from external providers are threatened.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold border-b border-[var(--border-solid)] pb-2 mb-4">6. Account Termination</h2>
                        <p className="leading-relaxed text-[var(--muted)]">
                            We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease. Users also have the self-service capability to permanently terminate and delete their own accounts from the Topbar profile menu.
                        </p>
                    </section>

                </div>
            </div>
        </div>
    );
}

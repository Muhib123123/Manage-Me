import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
    title: "Privacy Policy",
    description: "Manage Me Privacy Policy and Data Usage",
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[var(--surface)] text-[var(--text)]">
            <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
                <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--text)] transition-colors mb-10">
                    <ArrowLeft size={16} /> Back to Application
                </Link>
                
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Privacy Policy</h1>
                <p className="text-[var(--muted)] mb-12">Last updated: {new Date().toLocaleDateString()}</p>

                <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                    
                    <section>
                        <h2 className="text-2xl font-bold border-b border-[var(--border-solid)] pb-2 mb-4">1. Introduction</h2>
                        <p className="leading-relaxed text-[var(--muted)]">
                            Welcome to Manage Me ("we", "our", or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy governs how we collect, use, and share your data when you use our social media scheduling application. By using Manage Me, you consent to the data practices described in this statement.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold border-b border-[var(--border-solid)] pb-2 mb-4">2. Data We Collect</h2>
                        <p className="leading-relaxed text-[var(--muted)] mb-4">We collect personal information that you voluntarily provide to us when you register on the application and link your third-party social media accounts.</p>
                        <ul className="list-disc pl-5 text-[var(--muted)] space-y-2">
                            <li><strong>Personal Information:</strong> Includes your name, email address, and profile picture (retrieved via Google authentication).</li>
                            <li><strong>Media Content:</strong> Videos, shorts, reels, and photos you explicitly upload to our servers for the sole purpose of scheduling and publishing them to your connected accounts.</li>
                            <li><strong>OAuth Tokens:</strong> Securely stored, encrypted access and refresh tokens used to authenticate API requests on your behalf to YouTube, Instagram, and TikTok.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold border-b border-[var(--border-solid)] pb-2 mb-4">3. Third-Party API Platforms</h2>
                        <p className="leading-relaxed text-[var(--muted)] mb-4">
                            Manage Me uses external API services to publish content and read basic channel analytics. By authenticating these platforms, you are also bound to their respective Terms and Privacy Policies:
                        </p>
                        
                        <div className="bg-[var(--surface-2)] p-6 rounded-xl space-y-4 mb-4">
                            <h3 className="text-lg font-semibold text-[var(--text)]">Google & YouTube API Services</h3>
                            <p className="text-sm text-[var(--muted)] leading-relaxed">
                                Our application uses YouTube API Services to upload videos to your channel. We do not use your data for advertising or sell your Google user data to any third party. Our usage of Google user data is strictly limited to providing the core scheduling functionality.
                            </p>
                            <ul className="text-sm list-disc pl-5 text-[var(--muted)] space-y-1">
                                <li><strong>Google Privacy Policy:</strong> <a href="https://policies.google.com/privacy" className="text-blue-500 hover:underline" target="_blank" rel="noreferrer">https://policies.google.com/privacy</a></li>
                                <li><strong>YouTube Terms of Service:</strong> <a href="https://www.youtube.com/t/terms" className="text-blue-500 hover:underline" target="_blank" rel="noreferrer">https://www.youtube.com/t/terms</a></li>
                                <li><strong>Revoking Access:</strong> You can permanently revoke Manage Me's access to your Google account at any time via the <a href="https://myaccount.google.com/permissions" className="text-blue-500 hover:underline" target="_blank" rel="noreferrer">Google Security Settings</a> page.</li>
                            </ul>
                        </div>

                        <div className="bg-[var(--surface-2)] p-6 rounded-xl space-y-4 mb-4">
                            <h3 className="text-lg font-semibold text-[var(--text)]">Meta (Instagram Graph API)</h3>
                            <p className="text-sm text-[var(--muted)] leading-relaxed">
                                We utilize the Meta Graph API to publish photos and reels to your connected Instagram Professional Accounts. We store your long-lived access token securely and only use it to enact your explicitly scheduled POST requests.
                            </p>
                        </div>

                        <div className="bg-[var(--surface-2)] p-6 rounded-xl space-y-4">
                            <h3 className="text-lg font-semibold text-[var(--text)]">TikTok Developer Services</h3>
                            <p className="text-sm text-[var(--muted)] leading-relaxed">
                                We utilize the TikTok Video Kit Direct Post API. We temporarily securely store videos you upload for the duration until your scheduled time arrives, at which point the binary is securely transmitted to TikTok's servers.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold border-b border-[var(--border-solid)] pb-2 mb-4">4. How We Use Your Data</h2>
                        <ul className="list-disc pl-5 text-[var(--muted)] space-y-2">
                            <li><strong>To provide the service:</strong> To publish and process your scheduled posts natively on your behalf.</li>
                            <li><strong>To maintain security:</strong> To verify your identity across our services.</li>
                            <li><strong>No advertising:</strong> We <strong>DO NOT</strong> sell, rent, or lease your personal data or API data to third-party advertising networks, data brokers, or external entities.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold border-b border-[var(--border-solid)] pb-2 mb-4">5. Data Deletion & Your Rights</h2>
                        <p className="leading-relaxed text-[var(--muted)] mb-4">
                            You have full control over your data.
                        </p>
                        <ul className="list-disc pl-5 text-[var(--muted)] space-y-2">
                            <li><strong>Account Deletion:</strong> You can easily delete your Manage Me account by logging in, clicking your profile icon, and selecting "Delete Account".</li>
                            <li><strong>What happens upon deletion:</strong> Triggering an account deletion will instantly and permanently erase all your OAuth tokens, stored mediaURLs, scheduled posts, and user profile information from our database.</li>
                            <li><strong>Disconnections:</strong> You can disconnect individual accounts via the "Connections" tab within the app, which immediately drops the respective API tokens from our database.</li>
                        </ul>
                    </section>
                </div>
            </div>
        </div>
    );
}

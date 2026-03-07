export default function PrivacyPage() {
    return (
        <div className="p-10 max-w-3xl mx-auto prose prose-sm text-[var(--text)]">
            <h1>Privacy Policy</h1>
            <p><strong>Last updated:</strong> March 2026</p>
            <p>
                Manage Me ("we", "us", "our") is a personal social media scheduling tool.
                We collect only the information necessary to provide the service.
            </p>
            <h2>What we collect</h2>
            <ul>
                <li>Your name and email address via Google sign-in</li>
                <li>OAuth tokens for connected platforms (YouTube, Instagram, TikTok)</li>
                <li>Content you upload or schedule (videos, captions, metadata)</li>
            </ul>
            <h2>How we use your data</h2>
            <p>Your data is used solely to authenticate with connected platforms and publish scheduled content on your behalf. We do not sell or share your data with third parties.</p>
            <h2>Data storage</h2>
            <p>Data is stored securely in a hosted PostgreSQL database. OAuth tokens are encrypted at rest.</p>
            <h2>Contact</h2>
            <p>For any privacy questions, contact the app owner directly.</p>
        </div>
    );
}

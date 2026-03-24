# 🎬 Manage-Me — Multi-Platform Social Media Scheduler & Analytics Hub

**Manage-Me** is a powerful, centralized, and automated hub built for modern content creators. It securely links to your **YouTube**, **Instagram**, and **TikTok** accounts, allowing you to upload media directly, schedule automated publishing down to the exact second, and track your channel's growth and analytics in real-time.

Built from the ground up for performance and premium aesthetics, the application handles the complexity of polling varying social media API endpoints, managing background job queues for large file processing, and presenting insights through clean, interactive charts.

---

## 📦 Tech Stack

| Layer            | Technology                              |
| ---------------- | --------------------------------------- |
| Framework        | Next.js App Router (TypeScript)         |
| Styling          | Tailwind CSS v4 + Vanilla CSS Variables |
| Auth             | NextAuth.js v5 (Google, Facebook)       |
| Database         | PostgreSQL + Prisma ORM                 |
| Storage          | UploadThing (AWS S3 alternative)        |
| Queue Engine     | BullMQ + Upstash Redis                  |
| External APIs    | YouTube Data v3, Instagram Graph v22.0, TikTok Display |
| Deployment       | Local (Dev), Vercel/Railway (Prod)      |

---

## 📂 Application Structure

The codebase follows a modular Next.js 14+ App Router structure:

```text
manage-me/
├── app/                      # Next.js App Router root
│   ├── (dashboards)/         # Protected application workspaces
│   │   ├── connect/          # Hub for platform connections & OAuth bridging
│   │   ├── instagram-dashboard/ # Instagram posting, Reels, Carousels & Analytics
│   │   ├── tiktok-dashboard/    # TikTok posting, Captions & Analytics
│   │   ├── youtube-dashboard/   # YouTube posting, Shorts & Analytics
│   │   ├── pricing/             # Subscription tiers, tables, & upgrade UX
│   │   └── layout.tsx        # Shared navigation shell (Sidebar/Topbar)
│   ├── api/
│   │   ├── analytics/        # Time-series analytics polling & history fetchers
│   │   ├── auth/             # NextAuth endpoints (login callbacks)
│   │   ├── instagram/        # Instagram OAuth & upload webhooks
│   │   ├── tiktok/           # TikTok OAuth & upload webhooks
│   │   ├── youtube/          # YouTube OAuth & upload webhooks
│   │   └── uploadthing/      # File upload routes with strict file validations
│   ├── globals.css           # Global vanilla CSS & Tailwind tokens
│   └── page.tsx              # Public landing page
├── components/               # Shared reusable generic UI components
│   ├── analytics/            # High-performance GSAP charts and counters
│   ├── ConnectButton.tsx     # OAuth flow buttons
│   ├── DashboardTabs.tsx     # Animated view transition handlers
│   ├── Sidebar.tsx           # Left-hand dynamic navigation
│   └── Topbar.tsx            # Theme toggler & generic buttons
├── contexts/                 # React Context providers (e.g. Upload tracking)
├── lib/                      # Core backend logic & integrations
│   ├── auth.ts               # NextAuth configuration & generic providers
│   ├── instagram.ts          # Meta Graph API integration
│   ├── tiktok.ts             # TikTok Content Posting API integration
│   ├── youtube.ts            # Google APIs Youtube integration
│   ├── subscription.ts       # Subscription tiers, daily/monthly limits enforcement
│   ├── queue*.ts             # BullMQ Redis worker/queue setups for media
│   └── prisma.ts             # Prisma Database client singleton
├── prisma/                   # Database logic
│   └── schema.prisma         # PostgreSQL models (User, Post, Account, Connection)
└── public/                   # Static assets (fonts, icons, hero images)
```

---

## ⚙️ Core Architecture & Features

### 1. Unified Analytics & History Tracking
Every dashboard features a separated architectural view for **Schedule** and **Analytics**. Using custom-built charts mapped via D3 and GSAP animations, the application pulls live follower counts, view thresholds, and graphs chronological growth per channel.

### 2. Subscription & Bulk Rate Limiting
A centralized subscription mechanism enforces daily and monthly limits at both the UI and API levels:
- **Free Plan**: Locked to 15 posts per month globally. Limited to 7-day schedule horizons.
- **Creator Plan**: Unlimited scheduling up to 30 days ahead, and up to 20 posts per day per platform.

### 3. Multi-Platform OAuth Matrix
A single user signs in natively (via Google), but establishes distinct, long-lived backend OAuth connections for publishing logic:
- **YouTube**: Bound via incremental authorization for `youtube.upload` scopes, using reliable Resumable Upload strategies.
- **Instagram**: Bound via Facebook OAuth, utilizing Direct Instagram Account connection flows and long-lived access tokens.
- **TikTok**: Bound via TikTok's direct Developer API for native `video.publish`.

### 4. Background BullMQ Execution Array
Large video media requires processing bandwidth, and uploading them instantly would block the user session and lead to Vercel timeout limits.
- The app uses **Upstash Redis** as the backbone.
- When a user "Schedules" a post in the UI, it deposits an isolated record in PostgreSQL.
- A delayed BullMQ Job is pushed into memory.
- External workers automatically intercept the job at the scheduled UTC block, process the binary securely, handle multi-step upload mechanisms (like Instagram Container polling), and flip the status to `DONE`.

### 5. Seamless Component Styling
Built deeply around CSS Variables to support immaculate, instant dark/light mode swapping without reliance on heavy JS observation or flashes of unstyled content. Fully responsive dashboard structures prioritize interactive tables and fluid micro-animations.

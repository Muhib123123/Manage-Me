# 🎬 Manage-Me — Multi-Platform Social Media Scheduler

A centralized, automated hub that allows content creators to link their **YouTube**, **Instagram**, and **TikTok** accounts, upload media directly, and schedule automated post-publishing down to the exact second.

---

## 📦 Tech Stack

| Layer            | Technology                              |
| ---------------- | --------------------------------------- |
| Framework        | Next.js App Router (TypeScript)         |
| Styling          | Tailwind CSS v4 + Vanilla CSS           |
| Auth             | NextAuth.js v5 (Google, Facebook)       |
| Database         | PostgreSQL (Neon) + Prisma ORM          |
| Storage          | UploadThing (AWS S3 alternative)        |
| Queue Engine     | BullMQ + Upstash Redis                  |
| External APIs    | YouTube Data v3, Instagram Graph v22.0, TikTok Display |
| Deployment       | Local (Dev), Vercel/Railway (Prod)      |

---

## 📂 Complete Application Structure

```text
manage-me/
├── app/                      # Next.js App Router root
│   ├── (auth)/               # Login & signup pages
│   ├── (dashboards)/         # Protected application workspaces
│   │   ├── connect/          # Hub for platform connections & OAuth bridging
│   │   ├── instagram-dashboard/ # Instagram posting, Reels, Carousels UI
│   │   ├── tiktok-dashboard/    # TikTok posting, Captions & Privacy UI
│   │   ├── youtube-dashboard/   # YouTube posting, Shorts & Tags UI
│   │   ├── pricing/             # Subscription tiers, tables, & upgrade UX
│   │   └── layout.tsx        # Shared navigation shell (Sidebar/Topbar)
│   ├── api/
│   │   ├── auth/             # NextAuth endpoints (login callbacks)
│   │   ├── instagram/        # Instagram OAuth connect/callback + upload tasks
│   │   ├── tiktok/           # TikTok OAuth connect/callback + upload tasks
│   │   ├── videos/           # YouTube OAuth connect/callback + upload tasks
│   │   └── uploadthing/      # File upload routes with strict filetype validations
│   ├── globals.css           # Global vanilla CSS & Tailwind tokens
│   └── page.tsx              # Public landing page
├── components/               # Shared reusable generic UI components
│   ├── ConnectButton.tsx     # OAuth flow buttons
│   ├── DashboardShell.tsx    # Responsive shell logic
│   ├── Sidebar.tsx           # Left-hand dynamic navigation
│   ├── Topbar.tsx            # Theme toggler & generic buttons
│   └── ui/                   # Reusable atomic elements (spinners, inputs)
├── lib/                      # Core backend logic & integrations
│   ├── auth.ts               # NextAuth configuration & generic providers
│   ├── instagram.ts          # Meta Graph API integration (Photos, Video Polling, Carousels)
│   ├── tiktok.ts             # TikTok Content Posting API integration
│   ├── youtube.ts            # Google APIs Youtube integration
│   ├── subscription.ts       # Subscription tiers, daily/monthly limits enforcement
│   ├── queue*.ts             # (Multiple) BullMQ Redis worker/queue setups
│   └── prisma.ts             # Prisma Database client singleton
├── prisma/                   # Database logic
│   └── schema.prisma         # PostgreSQL models (User, Post, Account, Connection)
├── scripts/                  # Helper & maintenance scripts
│   ├── run-workers.mjs       # BullMQ central worker execution script
│   └── check-ig-token.mjs    # Developer auth token debugging script
├── .env.local                # Sensitive OAuth secrets & database URL
└── public/                   # Static assets (fonts, icons, hero images)
```

---

## ⚙️ Core Architecture & Features

### 1. Subscription & Rate Limiting (`lib/subscription.ts`)
The app utilizes a centralized subscription mechanism enforced at both the UI and API levels:
- **Free Plan**: Locked to 15 posts per month globally across all accounts. Limited to 7-day schedule horizons.
- **Creator Plan**: Unlimited scheduling up to 30 days ahead, and up to 20 posts per day per platform.
- APIs actively reject POST requests returning a `403` status if the user breaches their quota.

### 2. Multi-Platform OAuth Matrix
A single user connects using Google, but establishes distinct, long-lived backend OAuth connections for publishing logic:
- **YouTube**: Bound via incremental authorization for `youtube.upload` scopes.
- **Instagram**: Bound via Facebook OAuth, specifically filtering for `content_publish` permissions. Resolves direct Professional Account IDs.
- **TikTok**: Bound via TikTok's direct API for `video.publish`.

### 3. Asynchronous Rendering Engine (BullMQ)
Because media requires processing bandwidth, managing uploads sequentially blocks user interaction.
- Uses **Upstash Redis** as the backbone.
- When a user "Schedules" a post in the UI, it deposits an isolated record in Prisma `(status: PENDING)`.
- A delayed **BullMQ Job** is pushed into memory, scheduled for the exact UTC block the user chose.
- The external Node worker intercepts the job, securely exchanges tokens with Meta/Google, handles the binary transfer asynchronously, monitors the polling loop (e.g. `Media ID Processing`), and flips the database status to `DONE` or `FAILED`.

### 4. Advanced Graph API Containers
- **Instagram Carousel Pipeline**: The app breaks down multiple image uploads, generates isolated standalone "containers" per image on Meta's server, aggregates those container IDs, generates a master `CAROUSEL` container, waits strictly for processing via a specialized polling ping (`waitForInstagramContainer`), and finally issues the `media_publish` command.

### 5. Seamless Component Styling
Built deeply around CSS Variables to support immaculate, instant dark/light mode swapping without reliance on heavy JS observation. Fully responsive dashboard split structure prioritizing grid interfaces and micro-animations.

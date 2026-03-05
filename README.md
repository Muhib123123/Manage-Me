# 🎬 Manage-Me — Multi-Platform Social Media Scheduler

A centralized hub that allows content creators to sign up, connect their **YouTube** and **Instagram** accounts, and schedule automatic video and photo uploads to each platform independently.

---

## 📦 Tech Stack

| Layer            | Technology                              |
| ---------------- | --------------------------------------- |
| Framework        | Next.js 16 (App Router, TypeScript)     |
| Styling          | Tailwind CSS v4                         |
| Auth             | NextAuth.js v5 (Google & Facebook OAuth)|
| Database         | PostgreSQL + Prisma ORM                 |
| File Storage     | UploadThing                             |
| Job Queue        | BullMQ + Redis (Upstash Redis)          |
| APIs             | Google API (v3), Instagram Graph API    |
| Hosting          | Vercel (app) + Railway (Redis/Postgres) |

---

## ✨ Core Features

- **Hub-Based Authentication** — Users sign up via Google with **basic profile access only** (no heavy permissions required to create an account).
- **Independent Platform Connections** — Users manually connect their YouTube Channels and Instagram Creator/Business accounts from a central Connections Dashboard.
- **Unified Scheduling Engine** — A robust BullMQ + Redis backend that routes scheduled posts to the correct platform API at the exact second.
- **Dedicated YouTube Studio** — 
  - Upload Normal Videos or YouTube Shorts
  - Support for custom thumbnails, privacy settings, descriptions, and tags.
- **Dedicated Instagram Studio** —
  - Upload Photos, Videos, or Reels
  - Enforcement of Instagram strict rules (aspect ratios, max file sizes, media containers).

---

## 🗺️ Project Phases Overview

```
Phase 1 → Foundation & Basic Auth (Google Login - No YouTube Scopes)
Phase 2 → Database Architecture (Multi-platform models)
Phase 3 → The Connections Hub (Linking YouTube & Instagram via OAuth)
Phase 4 → Cloud Storage & File Router (UploadThing setup)
Phase 5 → Unified Dashboard UI & Routing
Phase 6 → YouTube Scheduling Pipeline (UI + API Integration)
Phase 7 → Instagram Scheduling Pipeline (UI + Graph API Integration)
Phase 8 → The Scheduler Engine (BullMQ Workers & Redis)
Phase 9 → Dashboard Separation & Restyling
Phase 10 → Instagram Carousel Uploads
```

---

---

# 🛠️ IMPLEMENTATION ROADMAP

## Phase 1 — Foundation & Basic Auth

### 1.1 Goal
Change the initial login flow so new users can create a `Manage-Me` account using Google **without** being forced to grant YouTube upload permissions immediately. This drastically reduces signup friction.

### 1.2 `lib/auth.ts` Updates
- Configure NextAuth with a standard `GoogleProvider` that only requests `openid`, `email`, and `profile`.
- Remove the `"https://www.googleapis.com/auth/youtube.upload"` scope from the default login.
- Users logging in successfully are redirected to the new `/dashboard/connect` page (Phase 3).

---

## Phase 2 — Database Architecture

### 2.1 Goal
Redesign the database schema to handle multiple connected platforms and uniquely structured posts for each platform.

### 2.2 Schema Updates (`prisma/schema.prisma`)
- **`Account` Model**: Ensure it tracks both `google` (for the app & YouTube token) and `facebook` (for the Instagram token) connections per `User`.
- **`Post` Model (Unified vs. Separate)**:
  - Create a generic `Post` model, or separate models (`YoutubePost`, `InstagramPost`) to keep platform-specific data clean.
  - **YouTube Data requirements**: `title`, `description`, `tags`, `privacy`, `videoType` (Normal/Short), `thumbnailUrl`.
  - **Instagram Data requirements**: `caption`, `mediaType` (Image/Video/Reel), `aspectRatio` constraints.
  - **Shared Data requirements**: `userId`, `storageUrl`, `scheduledAt`, `status` (PENDING, UPLOADING, DONE, FAILED), `externalId` (the ID after publishing), `errorMessage`.

---

## Phase 3 — The Connections Hub

### 3.1 Goal
Create a page where users formally grant the application access to post to their specific social channels.

### 3.2 UI (`app/(dashboard)/connect/page.tsx`)
- Display connection state for each platform (e.g., "YouTube: Not Connected", "Instagram: Not Connected").
- Provide "Connect" buttons for each.

### 3.3 Auth Flow
- **Connect YouTube**: Triggers an incremental authorization flow (or a specific NextAuth provider setup) requesting the Youtube Upload scope and `offline` access. Stores the resulting `refresh_token` in the DB.
- **Connect Instagram**: Triggers Facebook OAuth requesting `instagram_basic`, `instagram_content_publish`, `pages_show_list`, and `pages_read_engagement`. Maps the token to the user and identifies their connected Instagram Business/Creator ID.

---

## Phase 4 — Cloud Storage (UploadThing)

### 4.1 Goal
Set up file upload routers that categorize media based on its destination, as YouTube and Instagram have different strict requirements.

### 4.2 Setup (`app/api/uploadthing/core.ts`)
- `youtubeVideoUploader` (Up to 2GB, .mp4/.mov)
- `youtubeThumbnailUploader` (Up to 8MB images)
- `instagramImageUploader` (Strict checking for JPEGs, max 8MB, aspect ratios)
- `instagramVideoUploader` (Shorter limits, max 100MB for normal video, max 60s for reels)

---

## Phase 5 — Unified Dashboard UI & Routing

### 5.1 Goal
Refactor the UI layout to support navigating deeply into specific platform workspaces once they are connected.

### 5.2 Workspace Routing
```
app/(dashboards)/
├── connect/              ← The Hub
├── layout.tsx            ← Dynamic Sidebar based on connected accounts
├── youtube-dashboard/
│   ├── page.tsx          ← Sub-dashboard (Pending/Published YouTube videos)
│   └── upload/page.tsx   ← YouTube specific upload form
└── instagram-dashboard/
    ├── page.tsx          ← Sub-dashboard (Pending/Published IG posts)
    └── upload/page.tsx   ← Instagram specific upload form
```

### 5.3 Sidebar Updates
- If a platform is connected, its corresponding icon appears in the main navigation.
- If not connected, the user is prompted to visit the Hub.

---

## Phase 6 — YouTube Scheduling Pipeline

### 6.1 Goal
Migrate the existing upload form and API logic into the specific `youtube/` route.

### 6.2 Implementation
- **UI**: Move the current `UploadDropzone` and metadata form (Title, Bio, Tags, Privacy) to `app/(dashboard)/youtube/upload/page.tsx`.
- **API Setup (`lib/youtube.ts`)**: Maintain the resumable upload logic via the `googleapis` package. Ensure it fetches the *correct* `refresh_token` from the `Account` table (the one bound to YouTube, not the login token).
- **Enqueueing**: Upon submit, create the database record and queue a `youtube-upload` job in BullMQ set for `scheduledAt`.

---

## Phase 7 — Instagram Scheduling Pipeline

### 7.1 Goal
Build the new Instagram upload form and integrate the Facebook/Instagram Graph API for auto-publishing.

### 7.2 The Interface (`app/(dashboard)/instagram/upload/page.tsx`)
- Let user choose Media Type: **Photo**, **Video**, or **Reel**.
- **Media constraints**: Only allow JPEGs for photos within acceptable aspect ratios (4:5 to 1.91:1).
- Ask for user Caption. (No privacy settings or tags input needed like YouTube).

### 7.3 Graph API Integration (`lib/instagram.ts`)
Uploading to Instagram via API is a two-step process:
1.  **Create Media Container**: Call `POST /{ig-user-id}/media` passing the `image_url` or `video_url` (from UploadThing), the `caption`, and specifying if it's a `REELS`.
2.  **Publish Container**: Call `POST /{ig-user-id}/media_publish` passing the container ID returned from step 1.
- *Note: Video containers require polling the container status to ensure it's ready before publishing.*

---

## Phase 8 — The Scheduler Engine

### 8.1 Goal
Set up Upstash Redis and configure a robust BullMQ worker that processes jobs precisely when `scheduledAt` arrives.

### 8.2 Worker Logic (`lib/queue.ts`)
- Connect to Redis.
- Create central `social-publisher` Queue.
- Worker intercepts jobs and branches logic:
  ```typescript
  if (job.name === 'youtube-upload') {
      await uploadToYouTube(job.data.postId);
  } else if (job.name === 'instagram-upload') {
      await publishToInstagram(job.data.postId);
  }
  ```
- Handles Error updates in the DB (`status = FAILED`, populated `errorMessage`) so the UI displays the failure reason to the user in their respective platform dashboard.

---

## Phase 9 — Dashboard Separation & Restyling

### 9.1 Goal
Completely separate the YouTube and Instagram workspaces into distinct top-level routes (`/youtube-dashboard` and `/instagram-dashboard`) to treat both platforms as primary tools rather than sub-pages. Sync the styling so both look identically premium.

### 9.2 Route Restructuring
- Move `app/dashboard/layout.tsx` to `app/(dashboards)/layout.tsx` so both paths share the Sidebar.
- Move `app/dashboard/connect` to `app/(dashboards)/connect`.
- Rename `app/dashboard` (the YouTube UI) to `app/(dashboards)/youtube-dashboard`.
- Move `app/upload` into `app/(dashboards)/youtube-dashboard/upload`.
- Move `app/dashboard/instagram` to `app/(dashboards)/instagram-dashboard`.

## ⚠️ Important API Considerations

1.  **Instagram Business/Creator Check**: Personal Instagram accounts cannot use auto-publish. We must verify account type during the Connection phase (Phase 3).
2.  **Tokens**: Facebook/Instagram long-lived tokens expire after 60 days. The app needs a mechanism or prompt to refresh them. Google refresh tokens last indefinitely unless revoked.
3.  **Local Hosting Issue**: When testing Instagram API locally (`localhost:3000`), the Graph API **requires** public URLs for media. UploadThing fulfills this requirement perfectly.

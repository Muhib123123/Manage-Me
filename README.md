# 🎬 Manage-Me — YouTube Video Scheduler SaaS

A platform that allows YouTube content creators to upload videos, connect their YouTube channel via Google OAuth, and schedule automatic uploads at a specific date and time.

---

## 📦 Tech Stack

| Layer            | Technology                              |
| ---------------- | --------------------------------------- |
| Framework        | Next.js 16 (App Router, TypeScript)     |
| Styling          | Tailwind CSS v4                         |
| Auth             | NextAuth.js v5 (Google OAuth 2.0)       |
| Database         | PostgreSQL + Prisma ORM                 |
| File Storage     | UploadThing                             |
| Job Queue        | BullMQ + Redis (Upstash Redis)          |
| YouTube API      | `googleapis` npm package (v3)           |
| Email (optional) | Resend                                  |
| Hosting          | Vercel (app) + Railway (Redis/Postgres) |

---

## ✨ Core Features

- **Google OAuth Login** — Users sign in with their Google account and grant YouTube upload permissions
- **Video Type Selection** — When uploading, the user chooses between:
  - � **Normal YouTube Video** — Standard video upload
  - 🩳 **YouTube Short** — Vertical short-form video (≤60 seconds)
- **Video Metadata** — Each upload includes:
  - Title (max 100 characters)
  - Description / Bio (max 5000 characters)
  - Tags (comma-separated)
  - Thumbnail (optional image upload)
  - Privacy setting (Public / Unlisted / Private)
- **Scheduled Publishing** — User picks a specific date and time; the video is automatically uploaded to YouTube when that moment arrives
- **Dashboard — Pending Section** — Shows all videos that are waiting to be published (status: PENDING or UPLOADING), with their scheduled date/time countdown
- **Dashboard — Published Section** — Shows all videos that have been successfully uploaded to YouTube (status: DONE), with a link to the YouTube video
- **Error Visibility** — If an upload fails (status: FAILED), the user sees the error reason and can retry

---

## �🗺️ Project Phases Overview

```
Phase 1 → Project setup + Auth (Google OAuth)
Phase 2 → Dashboard UI + Video upload form
Phase 3 → Cloud storage integration (UploadThing)
Phase 4 → YouTube API integration (manual upload test)
Phase 5 → Scheduler engine (BullMQ + Redis)
Phase 6 → Status tracking, notifications, error handling
Phase 7 → Multi-client polish + deployment
```

---

---

# 🖥️ FRONTEND

## Phase 1 — Project Setup & Auth UI

### 1.1 Install Required Packages

```bash
npm install next-auth@beta @auth/prisma-adapter prisma @prisma/client
npm install googleapis
npm install @upstash/redis bullmq
npm install uploadthing @uploadthing/react
npm install date-fns uuid @types/uuid
```

### 1.2 Folder Structure (App Router)

```
app/
├── (auth)/
│   └── login/
│       └── page.tsx          ← Login page (Google sign-in button)
├── (dashboard)/
│   ├── layout.tsx            ← Dashboard layout (sidebar + topbar)
│   ├── dashboard/
│   │   └── page.tsx          ← Main dashboard (video list + stats)
│   ├── upload/
│   │   └── page.tsx          ← Upload form page
│   └── schedule/
│       └── page.tsx          ← Schedule management calendar view
├── api/
│   ├── auth/
│   │   └── [...nextauth]/
│   │       └── route.ts      ← NextAuth handler
│   ├── uploadthing/
│   │   ├── core.ts           ← UploadThing file router (videoUploader, thumbnailUploader)
│   │   └── route.ts          ← UploadThing Next.js route handler
│   ├── videos/
│   │   └── route.ts          ← CRUD for scheduled videos
│   └── scheduler/
│       └── route.ts          ← Trigger/check job queue (webhook or cron)
├── layout.tsx                ← Root layout
└── globals.css               ← Global styles (Tailwind)

prisma/
└── schema.prisma             ← Database models

lib/
├── auth.ts                   ← NextAuth config
├── prisma.ts                 ← Prisma client singleton
├── youtube.ts                ← YouTube API helper functions
├── uploadthing.ts            ← Typed UploadThing component helpers
└── queue.ts                  ← BullMQ queue setup

components/
├── VideoCard.tsx             ← Individual video card (status, date, thumbnail, type badge)
├── UploadForm.tsx            ← Drag & drop uploader + metadata fields + video type toggle
├── SchedulePicker.tsx        ← Date & time picker for scheduling
├── VideoTypeToggle.tsx       ← Toggle between Normal Video and YouTube Short
├── Sidebar.tsx               ← Dashboard navigation
├── CountdownTimer.tsx        ← Live countdown for pending videos
└── StatusBadge.tsx           ← PENDING / UPLOADING / DONE / FAILED badge
```

### 1.3 Login Page (`app/(auth)/login/page.tsx`)

- Show a clean page with a "Sign in with Google" button
- Use NextAuth's `signIn("google")` function
- After login → redirect to `/dashboard`

### 1.4 Dashboard Page (`app/(dashboard)/dashboard/page.tsx`)

The dashboard is split into **two clear sections**:

#### 📅 Pending Videos Section
- Shows all videos with status `PENDING` or `UPLOADING`
- Each card displays:
  - Thumbnail preview (or video type icon if no thumbnail)
  - Video title
  - Video type badge (Normal / Short)
  - Scheduled date & time (with countdown e.g. "Uploads in 2 days, 4 hours")
  - Status badge (PENDING = yellow, UPLOADING = blue)
  - Option to cancel/delete the scheduled upload
- If no pending videos → show empty state: "No scheduled uploads yet"

#### ✅ Published Videos Section
- Shows all videos with status `DONE`
- Each card displays:
  - Thumbnail preview
  - Video title
  - Video type badge (Normal / Short)
  - Published date
  - Status badge (DONE = green)
  - Direct link to the YouTube video (`youtube.com/watch?v=youtubeId`)
- If no published videos → show empty state: "No published videos yet"

#### ❌ Failed Videos Section (below Published)
- Shows all videos with status `FAILED`
- Each card displays the error reason and a **Retry** button
- If no failed videos → this section is hidden

#### Header
- Add a "**+ Schedule New Video**" button (top right) that links to `/upload`
- Show the user's connected YouTube channel name and avatar

### 1.5 Upload Form Page (`app/(dashboard)/upload/page.tsx`)

Fields required:
- **Video Type** (toggle/radio buttons)
  - 📹 `Normal Video` — standard YouTube video
  - 🩳 `YouTube Short` — vertical format, max 60 seconds (this sets the YouTube category accordingly)
- **Video file** (drag & drop via UploadThing, accepts `.mp4`, `.mov`, `.avi`, `.mkv`, up to 2GB)
- **Thumbnail image** (optional drag & drop, `.jpg`, `.png`) — only shown for Normal Videos (Shorts use auto-thumbnail)
- **Title** (text input, max 100 characters)
- **Description / Bio** (textarea, max 5000 characters — supports hashtags for Shorts)
- **Tags** (comma-separated input)
- **Scheduled Date** (date picker)
- **Scheduled Time** (time picker, displayed in user's local timezone)
- **Privacy** (dropdown: Public / Unlisted / Private)

On submit:
1. Video file uploads to **UploadThing** via `UploadDropzone` component (handled automatically)
2. Send metadata + UploadThing file URL + video type to `/api/videos` POST endpoint
3. Job is created in BullMQ queue with a delay until the scheduled time
4. Redirect to `/dashboard` → Pending section with success toast message

### 1.6 Status Badge Component (`components/StatusBadge.tsx`)

| Status      | Color  | Meaning                              |
| ----------- | ------ | ------------------------------------ |
| `PENDING`   | Yellow | Waiting for scheduled time           |
| `UPLOADING` | Blue   | Currently being uploaded to YouTube  |
| `DONE`      | Green  | Successfully published on YouTube    |
| `FAILED`    | Red    | Upload failed (see error log)        |

### 1.7 Environment Variables (Frontend)

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_here

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

---

---

# ⚙️ BACKEND

## Phase 2 — Authentication (Google OAuth + YouTube Scopes)

### 2.1 Create Google OAuth App

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project → Enable **YouTube Data API v3**
3. Go to **APIs & Services → Credentials → Create OAuth 2.0 Client ID**
4. Set Authorized Redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Copy `Client ID` and `Client Secret` into `.env.local`

### 2.2 NextAuth Config (`lib/auth.ts`)

```ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          // Request YouTube upload scope at login
          scope:
            "openid email profile https://www.googleapis.com/auth/youtube.upload",
          access_type: "offline", // Required to get refresh_token
          prompt: "consent",      // Force consent to always get refresh_token
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
```

> **IMPORTANT:** `access_type: "offline"` and `prompt: "consent"` are critical.
> Without them, you won't receive a `refresh_token` needed for background uploads.

### 2.3 Prisma Schema (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// NextAuth required models
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  videos        Video[]
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// App-specific model
model Video {
  id            String      @id @default(cuid())
  userId        String
  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  title         String
  description   String?     @db.Text
  tags          String[]
  privacy       String      @default("public")  // public | unlisted | private

  videoType     String      @default("video")   // video | short

  storageUrl    String      // URL of the video file in UploadThing
  thumbnailUrl  String?     // URL of the thumbnail in UploadThing (optional for Shorts)

  scheduledAt   DateTime    // When to upload to YouTube
  status        String      @default("PENDING") // PENDING | UPLOADING | DONE | FAILED
  youtubeId     String?     // YouTube video ID after upload
  errorMessage  String?     // Error details if FAILED

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}
```

After editing schema, run:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

---

## Phase 3 — Cloud Storage (UploadThing)

> We use **UploadThing** instead of Cloudflare R2 — no credit card required, built for Next.js, and has a generous free tier.

### 3.1 Setup UploadThing

1. Go to [uploadthing.com](https://uploadthing.com) → Sign in (GitHub or Google, no card needed)
2. Click **"Create a new app"** → name it `manage-me`
3. Go to **"API Keys"** tab → click the copy icon next to **UploadThing Token** (not Secret Key)
4. Add to `.env.local`:

```env
UPLOADTHING_TOKEN=your_token_here
```

### 3.2 UploadThing File Router (`app/api/uploadthing/core.ts`)

- Defines two upload endpoints:
  - `videoUploader` — accepts video files up to **2GB**
  - `thumbnailUploader` — accepts images up to **8MB**
- Both are protected by a session auth middleware
- Returns the uploaded file URL which is saved to the database

### 3.3 UploadThing Route Handler (`app/api/uploadthing/route.ts`)

- Mounts the file router at `/api/uploadthing`
- Handles all UploadThing GET and POST requests

### 3.4 Typed Components Helper (`lib/uploadthing.ts`)

- Exports `UploadDropzone` and `UploadButton` typed to our file router
- Used in the upload form page to provide the drag-and-drop UI
- File uploads are handled entirely by UploadThing — no manual pre-signed URL logic needed

---

## Phase 4 — YouTube API Integration

### 4.1 YouTube Helper (`lib/youtube.ts`)

```ts
import { google } from "googleapis";
import { prisma } from "./prisma";

export async function uploadToYouTube(videoId: string) {
  // 1. Fetch the video record from DB
  const video = await prisma.video.findUnique({ where: { id: videoId }, include: { user: true } });
  if (!video) throw new Error("Video not found");

  // 2. Get the user's Google OAuth tokens from the Account table
  const account = await prisma.account.findFirst({
    where: { userId: video.userId, provider: "google" },
  });
  if (!account?.refresh_token) throw new Error("No refresh token found");

  // 3. Create OAuth2 client with stored tokens
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({
    refresh_token: account.refresh_token,
    access_token: account.access_token ?? undefined,
  });

  // 4. Download video from R2/S3 as a stream
  const videoResponse = await fetch(video.storageUrl);
  const videoStream = videoResponse.body; // ReadableStream

  // 5. Upload to YouTube
  const youtube = google.youtube({ version: "v3", auth: oauth2Client });
  const response = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title: video.title,
        description: video.description ?? "",
        tags: video.tags,
      },
      status: {
        privacyStatus: video.privacy,
      },
    },
    media: {
      mimeType: "video/*",
      body: videoStream,
    },
  });

  // 6. Save YouTube video ID to DB
  await prisma.video.update({
    where: { id: videoId },
    data: { status: "DONE", youtubeId: response.data.id },
  });
}
```

### 4.2 Long Video Support (Resumable Upload)

All uploads use YouTube's **resumable upload protocol** via `googleapis`.
This is essential for videos longer than ~5 minutes:

- The video file is fetched from UploadThing via a URL.
- A `HEAD` request gets the exact `Content-Length` first.
- The stream + Content-Length is passed to `youtube.videos.insert()`,
  which tells googleapis to use the resumable protocol instead of a simple multipart upload.
- YouTube's simple upload cuts off videos > ~5MB. Resumable upload supports files up to **256GB**.

**Key difference per video type:**

| Feature | Normal Video | YouTube Short |
|---|---|---|
| Duration | Unlimited ✅ | ≤ 60 seconds |
| categoryId | `"22"` (People & Blogs) | Not set |
| Thumbnail | Custom upload supported | Auto-generated by YouTube |
| Description | As entered | Appended with `#Shorts` |
| Upload method | Resumable | Resumable |

### 4.3 YouTube API Quota Info

| Action         | Quota Cost |
| -------------- | ---------- |
| Video upload   | 1,600 units |
| Video update   | 50 units   |
| Channel read   | 1 unit     |
| Daily limit    | 10,000 units |

> This means approximately **6 uploads per day** per project.
> For production scale: apply for a **quota increase** in Google Cloud Console.

---

## Phase 5 — Scheduler Engine (BullMQ + Redis)

### 5.1 Setup Upstash Redis

1. Go to [Upstash](https://upstash.com/) → Create a Redis database
2. Add to `.env.local`:

```env
UPSTASH_REDIS_URL=rediss://your-upstash-url
UPSTASH_REDIS_TOKEN=your-upstash-token
```

### 5.2 Queue Setup (`lib/queue.ts`)

```ts
import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { uploadToYouTube } from "./youtube";
import { prisma } from "./prisma";

const connection = new IORedis(process.env.UPSTASH_REDIS_URL!, {
  tls: { rejectUnauthorized: false },
  maxRetriesPerRequest: null,
});

// The queue where jobs are added
export const videoQueue = new Queue("youtube-uploads", { connection });

// The worker that processes jobs
export const videoWorker = new Worker(
  "youtube-uploads",
  async (job) => {
    const { videoId } = job.data;

    // Mark as uploading
    await prisma.video.update({
      where: { id: videoId },
      data: { status: "UPLOADING" },
    });

    try {
      await uploadToYouTube(videoId);
    } catch (error: any) {
      // Mark as failed with error message
      await prisma.video.update({
        where: { id: videoId },
        data: { status: "FAILED", errorMessage: error.message },
      });
      throw error; // Re-throw so BullMQ marks job as failed
    }
  },
  { connection }
);
```

### 5.3 Scheduling a Video (in `/api/videos/route.ts`)

When a user submits the upload form, after saving to DB:

```ts
import { videoQueue } from "@/lib/queue";

// Calculate delay in milliseconds from now until scheduledAt
const delay = new Date(scheduledAt).getTime() - Date.now();

await videoQueue.add(
  "upload-video",
  { videoId: newVideo.id },
  { delay: Math.max(delay, 0) } // BullMQ waits 'delay' ms before processing
);
```

> BullMQ stores the job in Redis with the delay. When the time comes, it
> processes the job automatically — even if your server restarted in between.

---

## Phase 6 — Environment Variables (Complete)

Create a `.env.local` file in the root with ALL variables:

```env
# Next Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_with_openssl_rand_hex_32

# Google OAuth
GOOGLE_CLIENT_ID=from_google_cloud_console
GOOGLE_CLIENT_SECRET=from_google_cloud_console

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/manageme

# UploadThing Storage
UPLOADTHING_TOKEN=your_token_here

# Upstash Redis (for BullMQ)
UPSTASH_REDIS_URL=rediss://your-upstash-endpoint
UPSTASH_REDIS_TOKEN=your-upstash-token
```

---

## Phase 7 — Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Set up database
npx prisma migrate dev --name init

# 3. Start the development server
npm run dev

# 4. Open the app
# http://localhost:3000
```

---

## Phase 8 — Deployment Checklist

- [ ] Deploy PostgreSQL on [Railway](https://railway.app/) or [Neon](https://neon.tech/)
- [ ] Deploy Redis on [Upstash](https://upstash.com/)
- [ ] Set up R2 bucket on [Cloudflare](https://cloudflare.com/)
- [ ] Deploy app to [Vercel](https://vercel.com/) — connect GitHub repo
- [ ] Add all environment variables to Vercel project settings
- [ ] Update Google OAuth redirect URI to production URL
- [ ] Submit OAuth app for Google verification (required for public users)
- [ ] Apply for YouTube API quota increase if needed

---

## ⚠️ Important Notes

1. **Refresh Token** — The YouTube upload happens in the background (no user session).
   We use the stored `refresh_token` from the database. This is why `access_type: "offline"`
   and `prompt: "consent"` are mandatory in the Google provider config.

2. **Large File Uploads** — Videos go directly from the browser to R2/S3 via pre-signed URLs.
   They never pass through your Next.js server, avoiding timeouts and memory issues.

3. **BullMQ Worker** — In production, the BullMQ worker needs to run as a long-running
   process (not a serverless function). Consider running it as a separate service on Railway.

4. **OAuth Verification** — Google requires OAuth verification before your app can access
   other users' YouTube channels. Submit for review after testing is complete.
   Unverified apps are limited to 100 test users.

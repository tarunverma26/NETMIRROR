# REELBEAT — Full-Stack Cinematic Media Streaming Platform

**REELBEAT** is a full-stack media streaming web application built with **Next.js (App Router)**, **Tailwind CSS**, **Framer Motion**, **React Three Fiber (Three.js)**, and **MongoDB (Mongoose)** with **Cloudinary** media storage and JWT authentication.

It features four film industries: **Bollywood**, **Hollywood**, **Bhojpuri**, and **Tollywood** across three media types: **Movies**, **Songs**, and **Web Series**, alongside a private, role-protected **Admin Panel**.

---

## 🌟 Key Features

1. **Cinematic Dark Minimalist Design**:
   - Dark color palette: near-black (`#0A0A0A`, `#111111`) with deep red accents (`#E50914`, `#B00020`), clean Inter typography, and glowing red hover borders.
   - 60fps animations with Framer Motion, 3D card tilt physics, and smooth page transitions.
2. **3D Hero Visuals (React Three Fiber)**:
   - Floating 3D metallic film reel, emissive glowing red particle vortex, and dynamic spotlighting.
   - 3D perspective tilt cards for Movies, Songs, and Web Series on the home page.
3. **Themed Section Backgrounds**:
   - **Movies (`/movies`, `/movies/[industry]`)**: Drifting blurred movie-poster gallery wall with red vignette and film-grain effect.
   - **Songs (`/songs`, `/songs/[industry]`)**: Spinning vinyl record and animated audio-equalizer frequency bars.
   - **Web Series (`/series`, `/series/[industry]`, `/series/show/[id]`)**: Red-lit episode filmstrip sprocket background.
4. **Custom Media Players**:
   - **Custom Video Player (`/watch/[id]`)**: Red scrubber progress bar, play/pause overlay, speed selector (0.5x - 2x), volume, fullscreen, and keyboard shortcuts (Space, Arrow keys, M, F).
   - **Sticky Global Audio Player**: Fixed bottom player with track title, cover art, play/pause, seek scrubber, volume control, queue, and minimize pill that persists uninterrupted across page navigation.
5. **Private Admin Panel (`/admin`)**:
   - Completely hidden from regular users. Guarded by server-side middleware enforcing `role === 'admin'`. Non-admins are redirected to home (403 on API).
   - Dedicated login gateway at `/admin/login`.
   - Metrics Dashboard: Total Movies, Songs, Series, Episodes, and Recent Uploads.
   - Drag-and-drop media upload form with real-time progress bar, Cloudinary direct upload, and local storage fallback.
   - Web Series Episode manager with series selector, season and episode numbering.
   - Full Content Management table with search, filter, publish/unpublish toggle, edit modal, and deletion.

---

## 🏗️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS, Framer Motion, `@react-three/fiber`, `@react-three/drei`, Three.js, Lucide Icons
- **Backend**: Next.js Route Handlers (`app/api/*`)
- **Database**: MongoDB with Mongoose (with in-memory store fallback for instant zero-config testing)
- **File Storage**: Cloudinary (video, audio, thumbnails) + local multipart upload fallback
- **Auth**: JWT in secure `httpOnly` cookies, `bcryptjs` password hashing, RBAC (`admin` / `user`)
- **Validation & Security**: Zod schemas, in-memory IP rate limiting, and HTTP security headers

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm** or **pnpm**
- *(Optional)* Local MongoDB daemon or MongoDB Atlas connection string
- *(Optional)* Cloudinary account credentials

### 2. Installation
```bash
# Clone or navigate to the repository
cd reelbeat

# Install dependencies
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Edit `.env.local` to configure your environment:
```env
MONGODB_URI=mongodb://localhost:27017/reelbeat
JWT_SECRET=super_secret_reelbeat_jwt_key_development_9923847
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Administrator Credentials
ADMIN_EMAIL=tarunverma930547@gmail.com
ADMIN_PASSWORD=tarun@1245
ADMIN_NAME=Tarun Verma

# Cloudflare R2 Storage (Direct Browser-to-R2 Presigned Multipart Uploads)
R2_BUCKET=reelbeat-media
R2_ACCOUNT_ID=19bd049db95fbb8fe85fda6cad1f2689
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_PUBLIC_URL=https://pub-xxxxxx.r2.dev
```

### 4. Cloudflare R2 Setup
1. **Enable R2**: In the [Cloudflare Dashboard](https://dash.cloudflare.com/), navigate to **R2 Object Storage** and click **Get started** / **Enable R2**.
2. **Create Bucket**: Name the bucket `reelbeat-media` (or run `npx wrangler r2 bucket create reelbeat-media`).
3. **CORS Policy**: In the bucket Settings -> **CORS Policy**, paste:
```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://*.vercel.app"],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```
4. **R2 API Token**: Navigate to **R2** -> **Manage R2 API Tokens** -> **Create API token** with **Object Read & Write** permissions. Copy the `Access Key ID` and `Secret Access Key` into `.env.local`.
5. **Public Access**: Enable the `r2.dev` public URL in bucket Settings -> **Public access** or connect your custom domain.

### 4. Running the Application
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Credentials

| Role | Email | Password | Access |
|------|-------|----------|--------|
| **Admin** | Defined in `.env` (`ADMIN_EMAIL`) | Defined in `.env` (`ADMIN_PASSWORD`) | Full Admin Panel (`/admin`), Uploads, Content CRUD |
| **Demo User** | `viewer@reelbeat.com` | `User@ReelBeat2026` | Streaming, Favourites, Watchlist |

---

## 📁 Project Structure

```
reelbeat/
├── .env.example
├── .env.local
├── middleware.ts                      # Edge middleware protecting /admin and /api/admin/*
├── next.config.mjs
├── tailwind.config.ts
├── scripts/
│   └── seed.mjs                       # Standalone MongoDB database seeder
└── src/
    ├── app/
    │   ├── layout.tsx                 # Root layout with AudioProvider & AuthProvider
    │   ├── page.tsx                   # Home: 3D Hero, Tilt Cards, Recently Added
    │   ├── not-found.tsx              # Themed 404 page
    │   ├── login/page.tsx             # User Login
    │   ├── register/page.tsx          # User Registration
    │   ├── movies/
    │   │   ├── page.tsx               # Movies Hub (4 industry tabs + parallax wall)
    │   │   └── [industry]/page.tsx    # Filterable grid (genre, year, sort, search)
    │   ├── songs/
    │   │   ├── page.tsx               # Songs Hub (Equalizer background + industry cards)
    │   │   └── [industry]/page.tsx    # Track list & grid with instant playback
    │   ├── series/
    │   │   ├── page.tsx               # Web Series Hub (Episode strip background)
    │   │   ├── [industry]/page.tsx    # Industry series catalog
    │   │   └── show/[id]/page.tsx     # Show detail with seasons & episode selector
    │   ├── watch/
    │   │   └── [id]/page.tsx          # Custom video player & recommendations
    │   ├── admin/
    │   │   ├── login/page.tsx         # Dedicated admin sign-in portal
    │   │   ├── layout.tsx             # Admin sidebar layout
    │   │   ├── page.tsx               # Dashboard (analytics, stats, quick actions)
    │   │   ├── upload/page.tsx        # Drag-and-drop media & metadata upload
    │   │   └── manage/page.tsx        # Content management table (edit, delete, toggle)
    │   └── api/
    │       ├── auth/                  # login, register, logout, me
    │       ├── content/               # list, details, filters
    │       ├── user/                  # watchlist
    │       └── admin/                 # stats, content CRUD, upload, upload-signature
    ├── components/
    │   ├── 3d/
    │   │   ├── ReelHeroScene.tsx      # R3F 3D floating film reel, red particle vortex
    │   │   └── TiltCard.tsx           # 3D perspective tilt card for sections
    │   ├── backgrounds/
    │   │   ├── MovieGalleryBg.tsx     # Drifting poster wall with red vignette & grain
    │   │   ├── EqualizerBg.tsx        # Dynamic equalizer bars & spinning vinyl
    │   │   └── FilmStripBg.tsx        # Red-lit filmstrip cinematic effect
    │   ├── player/
    │   │   ├── CustomVideoPlayer.tsx  # Red progress bar, controls, keyboard shortcuts
    │   │   └── StickyAudioPlayer.tsx  # Bottom floating audio bar with persistent audio
    │   ├── admin/
    │   │   ├── AdminSidebar.tsx
    │   │   └── MediaUploader.tsx      # Drag-and-drop file upload with progress bar
    │   └── ui/
    │       ├── Navbar.tsx             # Cinematic header with search & profile
    │       ├── Footer.tsx
    │       ├── ContentCard.tsx        # Hover-glow movie/series/song card
    │       └── SkeletonCard.tsx       # Dark-red shimmer skeleton loader
    ├── context/
    │   ├── AuthContext.tsx            # Current user & admin role state
    │   └── AudioContext.tsx           # Global audio playback state across pages
    ├── lib/
    │   ├── db.ts                      # Resilient Mongoose connection manager
    │   ├── dataStore.ts               # In-memory store fallback with initial seed
    │   ├── initialData.ts             # Royalty-free sample movies, songs, series
    │   ├── jwt.ts                     # JWT sign/verify for httpOnly cookies
    │   ├── cloudinary.ts              # Cloudinary API config & signature helper
    │   ├── validations.ts             # Zod schemas for auth and content upload
    │   └── security.ts                # Rate limiting helper and security headers
    └── models/
        ├── User.ts                    # User model (name, email, passwordHash, role)
        ├── Content.ts                 # Movie/Song/Series model
        └── Episode.ts                 # Episode model for Web Series
```

---

## 🛡️ Admin Panel Security & Protection

- Access to `/admin` and `/api/admin/*` is strictly guarded by Next.js Edge Middleware (`middleware.ts`).
- Any unauthenticated request or request with `role !== 'admin'` trying to access `/admin` is immediately redirected to `/` (or receives a `403 Forbidden` response on `/api/admin/*`).
- Sign-in to the admin area is handled via the dedicated portal at `/admin/login`.

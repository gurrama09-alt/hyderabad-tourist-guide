# Hyderabad Tourist Guide (హైదరాబాద్ టూరిస్ట్ గైడ్)

A production-grade, installable Progressive Web Application (PWA) and responsive travel companion for Hyderabad. Built with Next.js (App Router), TypeScript, Tailwind CSS, Leaflet Maps, and Supabase.

---

## 🌟 Features Overview

1. **Tourist Places Explorer**: Richly curated destinations (Charminar, Golconda Fort, Hussain Sagar & Buddha Statue, Chowmahalla Palace, Salar Jung Museum, Qutb Shahi Tombs, Shilparamam, Ramoji Film City, and more). Filter by category, open-now status, free entry, wheelchair mobility, and GPS proximity.
2. **Interactive Map (Leaflet & OpenStreetMap)**: Multi-layer transport showcase with toggleable layers for:
   - **HMRL Metro Lines (Red, Blue, Green)**: Complete 60 stations with interchange badges and frequencies.
   - **MMTS Suburban Local Rails**: Lingampalli ↔ Nampally & Falaknuma ↔ Secunderabad corridors with station coordinates, South Central Railway timings, and ₹5–₹15 fares.
   - **TGSRTC City Buses**: Key bus links (e.g. Route 65 Charminar ↔ Golconda Fort).
   - **Nearby Amenities**: Legendary Biryani spots, luxury hotels, hospitals, and major railway terminals.
3. **Admin Dashboard with Authentication & Media Manager**:
   - **Secure Admin Login**: Email/Password (`admin@hyderabadtourism.gov.in` / `Nizam2026!`) and Instant Quick PIN (`1591`) authentication with persistent session management.
   - **Attraction Image & Gallery Editor**: Live cover image URL editor with real-time preview, high-definition photo presets, gallery photo addition/removal, and cover photo promotion.
   - **Travel Alerts & Reports**: Broadcast live service advisories and review community correction reports.
4. **Custom Itinerary Planner & PDF Trip Plan Export**:
   - **One-by-One Destination Selector**: Search, add, remove, and reorder custom monuments with instant travel time and monument entry fee tallies.
   - **TSP Optimization**: Automatically reorders destinations into the shortest travel sequence.
   - **Download Trip Plan as PDF**: Formatted vector travel voucher with print-optimized CSS, monument timetables, transport instructions, and emergency contact details.
5. **Multi-Transport Route Planner (Dijkstra / Graph Engine)**: Intelligent multi-modal routing engine calculating:
   - **Fastest Option**: Metro + pedestrian connector legs
   - **Cheapest Option**: TGSRTC City bus / MMTS local train
   - **Fewest Transfers**: Direct transit / auto rickshaw
   - **Direct Road**: Auto rickshaw and AC Cab
6. **Smart Route Comparison Matrix**: Side-by-side comparison table showing travel duration, distance type (`metro`, `train`, `bus`, `road`, `walking`), transfer penalties, and transparent **"Official fare"** vs **"Estimated cost"** badges.
7. **Travel Cost Calculator**: Multiplier for solo vs family groups (1 to 10 persons), customized day budgets, entry ticket breakdowns, and daily food/Irani chai allowances.
8. **AI Tourist Assistant**: Floating widget & audio guide backed by Gemini / OpenAI LLM integration with local domain RAG, multilingual support (**English, Telugu [తెలుగు], and Hindi [हिंदी]**), and voice input via the browser Web Speech API.
9. **Offline PWA Travel Guide**: Fully installable on Android and desktop PC via service worker (`sw.js`) and IndexedDB / localStorage caching.
10. **Data Integrity & Trust**: Every place and transit line carries `source`, `verified`, and `last_updated` columns.

---

## 🏗️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom **Emerald Green & Pearl White Palette** (Royal Emerald `#16A34A`, Vivid Green `#22C55E`, Nizami Gold `#D4AF37`, Pearl White `#FFFFFF` / `#F8FAFC`)
- **Interactive Maps**: Leaflet + OpenStreetMap tiles with custom SVG pins and MMTS dashed rail paths
- **Database & Auth**: Supabase (PostgreSQL with Row Level Security policies, indexes, and full seed data) + Local admin session fallback
- **Offline / PWA**: Web App Manifest (`manifest.json`) + Service Worker (`sw.js`) + Local storage cache
- **Print / PDF**: Custom `@media print` travel voucher layout for seamless vector PDF downloads
- **Deployment**: Vercel ready

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- Node.js 18.x or 20.x+
- npm 9.x+

### 2. Installation
```bash
git clone <your-repo-url>
cd hyd-tourist
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure your environment variables in `.env.local`:
```env
# Supabase Database Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here

# AI Tourist Assistant (Google Gemini or OpenAI API Key)
# If left empty, the application uses an intelligent embedded local tourist AI engine
AI_API_KEY=your-gemini-or-openai-api-key-here
```
> **Note:** The application includes a self-contained local fallback store and local AI RAG model, meaning it **runs immediately out-of-the-box even before connecting live Supabase keys**.

### 4. Running Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Supabase Setup & Seed Data

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Run the schema script located at:
   [`supabase/schema.sql`](supabase/schema.sql)
   - Creates `profiles`, `categories`, `places`, `place_photos`, `transport_lines`, `stations`, `line_stations`, `bus_routes`, `bus_stops`, `route_stops`, `fares`, `itineraries`, `favourites`, `reviews`, `reports`, and `alerts`.
   - Enables Row Level Security (RLS) policies for public reading, authenticated reviews/reports, and role-protected admin actions.
4. Run the seed data script located at:
   [`supabase/seed.sql`](supabase/seed.sql)
   - Seeds all **27 Red Line Metro stations (Miyapur ↔ LB Nagar)**
   - Seeds all **23 Blue Line Metro stations (Nagole ↔ Raidurg)**
   - Seeds all **10 Green Line Metro stations (JBS ↔ MGBS)**
   - Seeds Ameerpet, Parade Grounds, and MGBS interchange networks
   - Seeds TGSRTC city bus routes (e.g. Route 65 Charminar ↔ Golconda Fort)
   - Seeds official HMRL distance fare matrix
   - Seeds top 12+ historic Hyderabad attractions with photos and GPS coordinates.

---

## 🌐 Deploying to Vercel

1. Push your code to a GitHub or GitLab repository.
2. Sign in to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your repository.
4. In the **Environment Variables** section, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `AI_API_KEY` (Optional for Gemini 1.5 Flash assistant)
5. Click **Deploy**. Vercel will build the Next.js App Router bundle automatically.

---

## 📊 Real vs Sample Data & Refresh Guide

| Dataset | Real / Sample Status | Source Authority | How to Refresh |
| :--- | :--- | :--- | :--- |
| **HMRL Metro Lines & Stations** | **100% Real** | Hyderabad Metro Rail Limited (HMRL) Gazette & Official Timetable | Update via `supabase/schema.sql` or Admin Dashboard |
| **HMRL Fares Matrix** | **100% Real** | Official HMRL Fare Chart (₹20 to ₹60 distance slabs) | Refreshed according to HMRL fare notifications |
| **Tourist Monuments Info** | **100% Real** | Archaeological Survey of India (ASI) & Telangana Tourism Dept | Verified entry fees (Indian vs Foreign) & opening hours |
| **TGSRTC City Bus Routes** | **Representative Real Routes** | TGSRTC Greater Hyderabad City Zone Timetable | Expand route stops via GTFS feed or Admin portal |
| **MMTS Local Trains** | **Representative Real Corridors** | South Central Railway (SCR) Suburban Timetable | Import SCR MMTS seasonal schedule update |
| **Active Travel Alerts** | **Sample & Verified Advisory** | Hyderabad City Police & HMRL Operations Bulletins | Add or edit active notices directly in the `/admin` tab |

To refresh data at any time:
- **Client Cache**: Tap **"Download for Offline"** in the app header or in **"My Trip > Offline Cache Manager"**.
- **Database**: Run `supabase/seed.sql` in the Supabase console or edit individual places directly in the **Admin Dashboard** (`/admin`).

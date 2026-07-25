# NEXUS | Life Command Center & Daily OS

An adaptive, mobile-first Progressive Web Application (PWA) built with **Next.js (App Router)**, **Supabase Auth & Postgres DB**, and hosted on **Vercel Free Tier**. 

Designed as a personal life command center for fitness, athletic tracking, habits, productivity, and life OS analytics.

---

## ⚡ Key Features & Stack

* **🤖 Gemini & OpenAI AI Coach**: Generates fully custom, on-the-fly workouts using serverless API routes on Vercel (`/api/ai/coach`). Features individual exercise "re-rolling" (`/api/ai/reroll`) to instantly swap out movements while keeping API keys secure.
* **☁️ Supabase Auth & Cloud Database**: Complete cloud persistence using Supabase Auth (Google OAuth) and PostgreSQL with **Row Level Security (RLS)** to protect user data.
* **🏆 Gamification Trophy Room**: A dynamic achievements engine that tracks consistency and sports-specific volume, unlocking metallic badges (Bronze through Diamond) as you hit major milestones.
* **📊 Advanced Athletic Analytics**: Chart.js visualizations that track volume load distribution, sport duration, and training frequency across disciplines.
* **🏋️‍♂️ 20 Elite Curated Workouts**: A comprehensive built-in catalog of expertly programmed workouts divided evenly across Weightlifting, Running, Volleyball, Flag Football, and Recovery.
* **📅 Smart Calendar Recommendations**: Integrates in real-time with Google Calendar. Adapts your daily training automatically based on soreness levels and upcoming game days.
* **🔋 Fatigue & Soreness Feedback Loop**: Tracks Legs, Shoulders, and Core soreness alongside Overall Fatigue dynamically. High soreness levels temporarily block heavy loading in fatigued muscle groups and redirect recommendations to recovery protocols.
* **📱 Installable Mobile PWA**: Native-feeling iOS & Android Web App support configured via `@ducanh2912/next-pwa`. Launch APEX in full-screen standalone mode directly from your phone home screen.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 15 (App Router) |
| **Database & Auth** | Supabase Postgres DB & Supabase Auth (Google OAuth) |
| **Hosting** | Vercel (Free Tier) |
| **API Layer** | Vercel Serverless Functions (`/app/api/ai/*`) |
| **PWA Engine** | `@ducanh2912/next-pwa` (Service Worker & Web App Manifest) |
| **Styling** | Vanilla CSS / Metallic Dark Theme Design Tokens |
| **Data Viz** | Chart.js & `react-chartjs-2` |

---

## 🚀 Setup & Deployment Guide

### 1. Supabase Setup (Database & Auth)
1. Create a free project on [supabase.com](https://supabase.com).
2. Go to **SQL Editor**, paste the contents of `supabase/schema.sql`, and click **Run** to set up tables and RLS security policies.
3. Under **Authentication** -> **Providers** -> **Google**:
   - Enable Google OAuth.
   - Enter your **Google Client ID** and **Google Client Secret** (from [Google Cloud Console](https://console.cloud.google.com/)).
4. Under **Project Settings** -> **API**, copy your **Project URL** and `anon` `public` key.

### 2. Vercel Deployment Setup
1. Push your repository to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Add the following Environment Variables in Vercel Project Settings:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://<your-project-id>.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `<your-supabase-anon-key>`
4. Click **Deploy**.

### 3. Google OAuth Redirect URIs
In Google Cloud Console under your OAuth 2.0 Client ID:
- **Authorized JavaScript Origins**: `https://<your-app>.vercel.app`
- **Authorized Redirect URIs**: `https://<your-project-id>.supabase.co/auth/v1/callback`

---

## 💻 Local Development

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   ```

3. Start the Next.js development server:
   ```bash
   npm run dev
   ```

4. Build and test production bundle locally:
   ```bash
   npm run build
   npm start
   ```

---

## 📱 Mobile PWA Installation (iPhone / Android)

1. Open your published Vercel URL in **Safari** (iOS) or **Chrome** (Android).
2. On iOS: Tap **Share** -> **"Add to Home Screen"**.
3. On Android: Tap **Menu** (three dots) -> **"Install App"** or **"Add to Home Screen"**.
4. Open APEX from your home screen in full-screen native standalone mode!

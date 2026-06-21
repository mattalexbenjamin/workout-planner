# APEX Summer '26 | Athletic Recommender & PWA Tracker

An adaptive, mobile-first Progressive Web Application (PWA) designed to prepare you for sand volleyball, flag football, weightlifting, and running during the summer of 2026. 

APEX is a zero-dependency, client-side application that integrates with your personal schedule and daily recovery stats to suggest the optimal daily training session.

---

## ⚡ Key Features

* **📅 Smart Calendar Recommendations**: Integrates in real-time with your Google Calendar. It adapts your schedule automatically (e.g. recommending dynamic joint prehab on game days, avoiding leg-heavy plyometrics the day before match play, or suggesting express conditioning on busy workdays).
* **☁️ Google Drive Cloud Sync**: Uses your personal Google sign-in to securely store and sync your workouts in a hidden file (`apex_workout_data.json`) on your Google Drive. Allows seamless backup and sync across your computer and iPhone for free.
* **🏋️‍♂️ Fatigue & Soreness Feedback Loop**: Tracks Legs, Shoulders, and Core soreness alongside Overall Fatigue dynamically. High soreness levels temporarily block heavy loading in fatigued muscle groups and redirect recommendations.
* **📱 Installable Mobile PWA**: Added iOS Web App support. Open in Safari on your iPhone and tap "Add to Home Screen" to launch APEX in full-screen standalone mode with its own splash screen.
* **🎬 Dynamic Form Guides**: Quick-access video links next to each exercise that load curated tutorials or live YouTube form guide searches.
* **🔄 Offline Caching**: Supported by a Service Worker that caches your static assets, making the app load instantly even with spotty cellular beach/outdoor connections.

---

## 📂 Project Directory Structure

```text
├── index.html          # Main application UI container & modals
├── styles.css          # Premium dark athletic styles & layouts
├── workouts.js         # Exercise database & guide URL mappings
├── recommender.js      # Fatigue-adaptive recommendation engine
├── gcal.js             # Google OAuth, Calendar, and Drive REST API
├── app.js              # Application state, merge engine, and DOM binds
├── manifest.json       # PWA web app metadata for mobile installation
├── sw.js               # Service Worker for assets offline caching
├── .gitignore          # Excludes OS and editor metadata from commits
└── icons/              # Launcher logo icons in 180px, 192px, and 512px
```

---

## 🚀 Setup & Local Verification

### 1. Launch a Local Server
Since the app uses OAuth login and fetches files client-side, it must run on a local HTTP server. Open your terminal in this directory and execute:
```bash
npx http-server
```
or launch using the **Live Server** extension in VS Code. Navigate to the printed address (usually `http://localhost:8080`).

### 2. Verify with Mock Mode
- In **Settings**, toggle **Mock Google Calendar Mode** to **ON**.
- This will inject simulated events (like "Beach Volleyball Play" or "Flag Football Game") for June 2026.
- Navigate to the **Today** dashboard and test logging workouts with different soreness ratings to watch the recommender adjust.

---

## 🌐 Deploy to GitHub Pages (iOS Home Screen)

### Step 1: Create a GitHub Repository
1. Push this directory's files to a free repository on GitHub.
2. In your repository, go to **Settings** -> **Pages**.
3. Under **Branch**, select `main` and root (`/`), then click **Save**.
4. GitHub will give you a secure public link: `https://<username>.github.io/<repo-name>/`.

### Step 2: Configure Google OAuth Console
Google restricts calendar and storage access to secure, authorized domains:
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your project credentials and edit your **OAuth 2.0 Client ID**.
3. Under **Authorized JavaScript Origins**, add:
   - Your local testing URL: `http://localhost:8080` (or `http://127.0.0.1:8080`)
   - Your production GitHub Pages URL: `https://<username>.github.io`
4. Click **Save** (allow 3-5 minutes for Google to process).

### Step 3: Install on iOS (iPhone)
1. Open your GitHub Pages URL in **Safari** on your iPhone.
2. Tap the **Share** button (up-arrow box) at the bottom.
3. Select **"Add to Home Screen"** and tap Add.
4. Launch the **APEX** app from your home screen. Go to Settings, paste in your Client ID, toggle Mock Mode **OFF**, sign in with Google, and check the checkbox to authorize Drive cloud sync.

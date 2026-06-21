# Walkthrough - APEX Summer '26 Mobile PWA & Google Drive Cloud Sync

We have successfully transformed the APEX Summer '26 workout prototype into an installable **Progressive Web App (PWA)** with a fully automated, free **Google Drive Cloud Sync** mechanism. You can now use the app full-screen on your iPhone and seamlessly sync your historical data, goals, and recommendations between your phone and computer.

---

## 📂 Summary of Changes

The modifications and new additions in your workspace:

### 1. Progressive Web App (PWA)
- **[NEW] [manifest.json](file:///c:/Users/matta/OneDrive/Desktop/Projects/Workout%20Planner/manifest.json)**: Declares configuration metadata (App names, stand-alone display mode, deep-black theme, and references to icon files).
- **[NEW] [sw.js](file:///c:/Users/matta/OneDrive/Desktop/Projects/Workout%20Planner/sw.js)**: Registers service worker assets caching (HTML, CSS, JS, and icons) for instant launches and offline operation.
- **[icons/ directory](file:///c:/Users/matta/OneDrive/Desktop/Projects/Workout%20Planner/icons)**: Generated and placed the premium, energetic orange APEX app logo in high-res launcher sizes (512x512, 192x192, and iOS-standard 180x180).
- **[index.html](file:///c:/Users/matta/OneDrive/Desktop/Projects/Workout%20Planner/index.html)**: Added viewport meta tags enabling iOS full-screen execution (`apple-mobile-web-app-capable`), links to touch icons/manifest, and registered the service worker script.

### 2. Google Drive Cloud Sync
- **[gcal.js](file:///c:/Users/matta/OneDrive/Desktop/Projects/Workout%20Planner/gcal.js)**
  - Upgraded OAuth client scopes to request both Google Calendar (`calendar.events.readonly`) and Google Drive file access (`drive.file`).
  - Added REST fetch functions to query Drive for `apex_workout_data.json`, download existing backup payloads, and write/patch updates using a custom boundary-delimited multipart form post.
- **[app.js](file:///c:/Users/matta/OneDrive/Desktop/Projects/Workout%20Planner/app.js)**
  - Integrated log session UUIDs (combining timestamps and random hashes) to enable collision-free data merging.
  - Implemented `mergeLogs()` which merges local and cloud histories, deduplicates by UUID, and sorts chronologically.
  - Added `syncWithGDrive()`: Initiates a background download, merges local history with cloud data, and uploads the combined state back to Drive.
  - Set up background auto-sync triggers on app boot and after saving new logged sessions.
  - Implemented the `updateDriveStatusUI` rendering methods.
- **[index.html](file:///c:/Users/matta/OneDrive/Desktop/Projects/Workout%20Planner/index.html)**: Added a cloud sync status indicator in the header, last sync timestamp labels, and a manual "Sync Now" trigger button in the Settings menu.
- **[styles.css](file:///c:/Users/matta/OneDrive/Desktop/Projects/Workout%20Planner/styles.css)**: Added styling rules for the drive sync controls and active/disabled states.

---

## ⚡ How to Deploy and Setup (Prototype to iPhone)

Follow this 5-step guide to run and sync the app live on your iPhone:

### Step 1: Deploy the App (Free Hosting)
Since the app is pure HTML/CSS/JS, you can host it for free. 
- **Via GitHub Pages (Recommended)**:
  1. Put your files on a free, public or private GitHub repository.
  2. In your repo, go to **Settings** -> **Pages**.
  3. Under **Branch**, select `main` and root (`/`), then click **Save**.
  4. GitHub will publish your site to: `https://<username>.github.io/<repo-name>/`.
- **Via Vercel**:
  1. Open terminal in workspace, run `npx vercel`.
  2. Link and deploy to a free Hobby project. It will output a secure URL (e.g. `https://apex-workout.vercel.app`).

### Step 2: Configure Google OAuth Console
For safety, Google blocks logins from unauthorized domains. You must configure it:
1. Open your [Google Cloud Console](https://console.cloud.google.com/).
2. Select your workout project and go to **APIs & Services** -> **Credentials**.
3. Under **OAuth 2.0 Client IDs**, edit the Client ID you use in Settings.
4. Under **Authorized JavaScript Origins**, add:
   - Your local URL (e.g. `http://localhost:8080` or `http://127.0.0.1:8080` for laptop tests).
   - Your new hosted production URL (e.g. `https://<username>.github.io` or `https://apex-workout.vercel.app`).
5. **Save** the changes (allow 5 minutes for Google to propagate).

### Step 3: Connect the App
1. Open your hosted site URL on your laptop.
2. Go to **Settings**, paste in your Google Client ID, turn **off** "Mock Calendar Mode", and click **Save Client ID**.
3. Click **Sign in with Google** and complete the consent screen. *Be sure to check the box authorizing Google Drive file access!*
4. Once signed in:
   - Your **Calendar** badge in the header turns green ("Calendar Connected").
   - Your **Cloud** badge turns green ("Cloud Backed Up").
   - A file named `apex_workout_data.json` will automatically be created in your root Google Drive (you can verify it exists on your Google Drive dashboard!).

### Step 4: Install on your iPhone (PWA)
1. Open your hosted URL in **Safari** on your iPhone.
2. Tap the **Share** button (the square icon with the up-arrow at the bottom).
3. Scroll down and tap **"Add to Home Screen"**.
4. Give it the name "APEX" and click Add.
5. Close Safari and tap the new **APEX** app icon on your home screen. It will open in a premium, full-screen standalone frame with its own splash screen!

### Step 5: Sign In and Sync on iPhone
1. In the standalone iPhone app, go to **Settings** and tap **Sign in with Google** to authorize it once.
2. Tap **Sync Now** (or save a workout). All history and goals logged on your laptop will instantly download and merge onto your phone, and any workouts you log on your phone will sync back to your computer!

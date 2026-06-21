# Implementation Plan - PWA Mobile Setup & Google Drive Sync

To make the APEX Summer '26 workout tracker a robust, daily utility on your iPhone with cross-device backups, we will implement two core features:
1. **Google Drive Sync (Cloud Backups)**: Leverage your existing Google sign-in to securely store and sync your workouts in a file (`apex_workout_data.json`) on your Google Drive. This provides cross-device sync (iPhone and laptop) and automatic backups.
2. **Progressive Web App (PWA)**: Upgrade the app to support standalone mobile execution (launches full-screen on iOS without Safari navigation bars) and service-worker caching for instant, offline loading.

## User Review Required

> [!IMPORTANT]
> **New Google OAuth Scopes**: We will request the Google Drive file scope: `https://www.googleapis.com/auth/drive.file`. When logging in next, Google will ask for permission to "See, edit, create, and delete only the specific Google Drive files you use with this app."
>
> **Google OAuth Configuration**: You will need to add your hosted URL (e.g. GitHub Pages `https://<username>.github.io` or Vercel `https://*.vercel.app`) to your Google Cloud Console under **Authorized JavaScript Origins** so sign-in functions on your phone.
>
> **Installation on iOS**: Open the hosted page in **Safari**, tap **Share** (up arrow box), and select **"Add to Home Screen"**.

## Proposed Changes

We will modify files inside the workspace directory `C:\Users\matta\OneDrive\Desktop\Projects\Workout Planner`.

---

### 1. Google API & OAuth Scope Upgrades
#### [MODIFY] [gcal.js](file:///c:/Users/matta/OneDrive/Desktop/Projects/Workout%20Planner/gcal.js)
- Update OAuth request scopes to include both Calendar and Drive:
  - Scope: `https://www.googleapis.com/auth/calendar.events.readonly https://www.googleapis.com/auth/drive.file`
- Implement Google Drive REST API functions:
  - `findBackupFile()`: Search Drive for `apex_workout_data.json`.
  - `downloadBackupFile(fileId)`: Fetch file content from Drive.
  - `uploadBackupFile(fileId, data)`: Create or update (PATCH) the backup file with local logs and settings.
  - `syncDriveLogs(localData, onComplete, onError)`: Run a full download-merge-upload sync cycle.

---

### 2. State Controller, Session UUIDs & Sync UI
#### [MODIFY] [app.js](file:///c:/Users/matta/OneDrive/Desktop/Projects/Workout%20Planner/app.js)
- **Unique Log Identifiers**: Add a unique `uuid` (timestamp + random string) to all new workout/sport logs. This allows seamless merging of logs synced between devices.
- **Merge Logic**: Implement a log merger that deduplicates items by `uuid` and sorts them chronologically.
- **Drive Sync UI**:
  - Add a "Google Drive Cloud Sync" section on the Settings tab showing the last sync time and a manual "Sync Now" button.
  - Add a small cloud status badge next to the Calendar badge in the header.
- **Auto-Sync Trigger**: Automatically initiate a silent background sync on application start and whenever a new session is logged.

---

### 3. PWA Configuration (HTML & Service Worker)
#### [MODIFY] [index.html](file:///c:/Users/matta/OneDrive/Desktop/Projects/Workout%20Planner/index.html)
- Add web app headers to `<head>`:
  - `<link rel="manifest" href="manifest.json">`
  - iOS standalone meta tags: `<meta name="apple-mobile-web-app-capable" content="yes">`, `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`.
  - iOS touch icon link: `<link rel="apple-touch-icon" href="icons/apple-icon-180.png">`.
- Add script block at bottom of file to register the service worker (`sw.js`).
- Add a manual "Google Drive Sync" button in Settings and a sync-status indicator in the header.

#### [NEW] [manifest.json](file:///c:/Users/matta/OneDrive/Desktop/Projects/Workout%20Planner/manifest.json)
- Create Web Manifest declaring app names, standalone display mode, background/theme colors, and references to icon files.

#### [NEW] [sw.js](file:///c:/Users/matta/OneDrive/Desktop/Projects/Workout%20Planner/sw.js)
- Implement a service worker that caches HTML, CSS, and JS files, serving them cache-first so the app opens instantly on your phone.

---

### 4. Custom App Icons
#### [NEW] App Icons in `/icons`
- Generate a high-contrast APEX logo (512x512 png) and downscale to 192x192 and 180x180 sizes for mobile launcher icons.

---

## Verification Plan

### Manual Verification
1. **PWA Standalone Check**: Load the app in Chrome/Safari mobile, install it to the home screen, open it, and verify it launches full-screen.
2. **Drive Authorization Check**: Toggle off Mock Mode in Settings, tap **Sign in with Google**, and verify the OAuth consent screen requests access to Google Drive files.
3. **Data Sync & Merge**:
   - Log a workout on your laptop with custom notes. Verify it auto-uploads to your Google Drive.
   - Open your Google Drive dashboard and verify the file `apex_workout_data.json` exists.
   - Open the app on your phone, sign in, sync, and verify the workout appears in your phone's history list.

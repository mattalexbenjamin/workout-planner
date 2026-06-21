# Google OAuth Publishing & Security Guide | APEX Summer '26

This guide explains how to transition your APEX Google Cloud project from **Testing** to **In Production** so you can easily share the app with friends. It also provides a detailed, plain-English breakdown of why this serverless architecture is completely safe, private, and secure for both you and anyone you share it with.

---

## 🚀 How to Publish Your Google App (Option B)

By default, your Google Cloud project is in **Testing** mode. In Testing mode, only users whose email addresses you manually whitelist under "Test Users" in the Google Cloud Console can sign in. 

Moving your app to **In Production** (publishing it) removes this restriction, allowing anyone with a Google account to sign in and sync their workouts.

### Step-by-Step Publishing Instructions

1. **Open the Google Cloud Console**:
   * Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
   * Select your APEX workout planner project from the dropdown at the top.

2. **Go to the OAuth Consent Screen Settings**:
   * In the left sidebar, click on **APIs & Services** > **OAuth consent screen**.

3. **Publish the App**:
   * Under **Publishing status**, locate the button labeled **Publish App** and click it.
   * A dialog will pop up stating that your app will be available to any user with a Google Account. Click **Confirm**.

4. **Verify the Status Change**:
   * The status will now change to **In Production**.
   * Note the verification status will show *“Needs verification”* or *“Unverified”*. This is expected and perfectly fine (see the Security section below on how to bypass this warning).

> [!NOTE]
> You do **not** need to submit the app for Google's official verification review unless you want to remove the "Unverified App" warning screen for public users. For personal use and sharing with a small group of friends (up to 100), the unverified production state is completely sufficient.

---

## 🔒 Security & Privacy Audit: Why APEX is Safe

Because APEX uses a serverless, client-side design, many standard web security concerns (like server hacks, database leaks, or password thefts) do not apply. Here is a clear analysis of common security questions and why they are not concerns.

### 1. The Google "Unverified App" Warning Screen
When you or a friend first signs in, Google will display a warning screen saying: **"Google hasn't verified this app"** or **"This app isn't verified."**

* **Why it happens**: Google displays this warning automatically for *any* application that requests access to sensitive scopes (like reading Calendar events or saving files to Google Drive) before the developer pays for/submits to a formal review.
* **Why it's NOT a concern**: 
  * The code is 100% transparent and runs directly in your browser. There is no hidden backend server collecting your data.
  * You can review the exact API calls in [gcal.js](file:///c:/Users/matta/OneDrive/Desktop/Projects/Workout%20Planner/gcal.js) and see that it only touches Google Calendar to fetch sports/meetings and Google Drive to backup your workout JSON file.
  * **How to bypass it**: Click **Advanced** at the bottom of the warning screen, then click **Go to APEX Workout (unsafe)**.

### 2. Client ID Exposure in Settings & LocalStorage
To run the app, you enter a Google Client ID in the settings menu, which is saved in your browser's local storage.

* **Why it's NOT a concern**:
  * An OAuth 2.0 **Client ID is public by design**. It is simply a unique identifier that tells Google *which* application is requesting access. It is not a secret password or API key.
  * In client-side (Single Page Application) architectures, the Client ID is always visible in the browser's source code or network traffic.
  * **No Client Secret is used or stored** in APEX. Client secrets are only required for backend server configurations, meaning a malicious actor cannot hijack your developer credentials to make backend requests on your behalf.

### 3. Data Isolation: Will my friends see my workouts (or vice-versa)?
Since multiple people will use the same Client ID to sign in, you might wonder if their workouts will merge with yours.

* **Why it's NOT a concern**: 
  * **100% Isolated Sessions**: When a user logs in, the app authenticates *them* individually with Google. Google issues a secure access token that belongs *only* to their browser session.
  * **No Shared Database**: APEX does not have a centralized database. Instead, it reads and writes to the signed-in user's own Google Drive.
  * **Drive Sandbox Scope**: APEX uses the `https://www.googleapis.com/auth/drive.file` scope. This is a secure "sandboxed" scope that **only** allows APEX to view and edit files that *this specific application created*. It cannot see or modify any other files in their Google Drive.
  * Consequently, your data remains in your Google Drive, and your friend's data remains in theirs. It is physically impossible for data to leak between accounts.

### 4. Client ID Theft / Impersonation
What if a malicious actor copies your Client ID and tries to use it to build a fake phishing website?

* **Why it's NOT a concern**:
  * Google protects against this using **Authorized JavaScript Origins** and **Authorized Redirect URIs**.
  * When you set up your Client ID in the Google Cloud Console, you configured specific URLs (like `http://localhost:8080` and `https://mattalexbenjamin.github.io`) that are allowed to use that Client ID.
  * If someone copies your Client ID and tries to run it from a different website (e.g., `https://malicious-site.com`), Google’s authentication server will check the origin of the request, see that it is not on the authorized list, and block the login immediately with an `origin_mismatch` or `invalid_client` error.

### 5. Cost and Quota Limits for Friends
Will sharing the app with friends cause you to exceed quotas or incur Google API costs?

* **Why it's NOT a concern**:
  * Google Cloud Console and the APIs used (Calendar, Drive, OAuth) are completely free.
  * **Unverified Production Limits**: Google allows up to **100 individual users** to grant access to an unverified production app. This is more than enough for a personal group of friends.
  * **API Quota Pools**: Google's API quotas (e.g., 1,000,000 Calendar requests/day) are set per GCP project and are massive. A group of 5-10 friends logging workouts will consume less than 0.01% of the daily limit.

---

## 👥 How to Share APEX with Your Friends

To share the app with a friend, follow these steps:

1. **Provide the App Link**:
   * Send them the link to your hosted GitHub Pages site (e.g., `https://mattalexbenjamin.github.io/workout-planner/`).

2. **Provide your Google Client ID**:
   * Give them the Client ID string from your Google Cloud Console (the same one you enter into your settings).
   * *Tip*: Since they will run the app on the same GitHub Pages domain, they can use your exact Client ID.

3. **Their First Login**:
   * Tell them to open the app link on their device, go to **Settings**, paste your Client ID, and toggle Mock Mode **OFF**.
   * Click **Sign In with Google**, click **Advanced** -> **Go to APEX Workout (unsafe)**, and check the checkbox to grant Google Drive file creation access.
   * They are now set up with their own private cloud-synced workout database!

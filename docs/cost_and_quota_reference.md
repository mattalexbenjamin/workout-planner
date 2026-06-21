# Cost & API Quota Reference Guide | APEX Summer '26

This document outlines the hosting, database, and API cost structures for the APEX workout application. Because the application is built using a **serverless, client-side architecture**, it utilizes free resources and your personal cloud storage, making it completely free to run for personal use indefinitely.

---

## 🏗️ Architecture Overview: Why is it Free?
Traditional mobile and web apps require a centralized backend server and database (e.g. AWS, Firebase, or SQL databases) to store user data. These servers run 24/7 and accrue monthly maintenance fees.

APEX completely sidesteps this by using **Decentralized Client-Side Storage**:
1. **Hosting**: Hosted as static files (HTML/CSS/JS) on GitHub's free servers.
2. **Database**: Your workout logs are stored in your own browser's local memory (`LocalStorage`).
3. **Backups & Syncing**: Your database is synced directly to your personal Google Drive account.
4. **Calendar Checks**: The app communicates directly from your device to Google APIs.

Because no centralized servers are running, **operating cost = $0.00**.

---

## 📊 Detailed Quotas & Free Tier Thresholds

Below are the exact billing thresholds and query limits for each service integrated with APEX:

### 1. GitHub Pages (Static Hosting)
* **Cost**: **$0.00**
* **Free Tier Limits**:
  * **Bandwidth**: 100 GB per month.
  * **Build Limit**: 10 builds per day.
  * **Site Size**: 1 GB maximum repository size.
* **Our App Profile**: The entire APEX app (including HTML, CSS, JS, manifest, and icons) is approximately **150 KB**.
* **Traffic threshold to incur costs**: You would need more than **660,000 visitors opening the app every month** to exceed GitHub's free bandwidth limit.

### 2. Google OAuth (Sign-In & Consent)
* **Cost**: **$0.00**
* **Limits**: None. Google Identity Services does not charge for user authentications.
* **Traffic threshold to incur costs**: Never. Google Sign-In is a free public utility.

### 3. Google Calendar API (Adaptive Recommendations)
* **Cost**: **$0.00**
* **Free Tier Limits**: **1,000,000 queries per day** per project.
* **Our App Profile**: The app only queries your calendar when it boots up or when you click "Refresh Calendar." A single user averages 10 to 20 queries per day.
* **Traffic threshold to incur costs**: You would need more than **50,000 active daily users** before hitting the default quota. (And even if you hit it, requesting a quota extension from Google is free).

### 4. Google Drive API (Backup & Sync)
* **Cost**: **$0.00**
* **Free Tier Limits**:
  * **Queries**: Billions of requests per day (10,000 queries per 100 seconds).
  * **Storage**: 15 GB of free space per personal Google Account.
* **Our App Profile**: The backup file `apex_workout_data.json` is roughly **3 KB** in size (even after months of logging).
* **Traffic threshold to incur costs**: Your backup file takes up **0.00002%** of your free Google Drive storage. It would take **8,000 years of daily logging** to fill up your free space.

---

## 📉 Summary Cost Table

| Service | Purpose | Limit Type | Free Tier Limit | APEX Actual Use | Cost |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GitHub Pages** | App Hosting | Bandwidth | 100 GB / month | ~150 KB / load | **$0.00** |
| **Google Auth** | Sign-In | Users | Unlimited | 1 User (You) | **$0.00** |
| **Calendar API** | Schedule Check | Queries | 1,000,000 / day | ~20 / day | **$0.00** |
| **Drive API** | Cloud Sync | Queries | 20,000 / 100 sec | ~5 / day | **$0.00** |
| **Google Drive** | Data Backup | Space | 15 GB / account | ~3 KB | **$0.00** |

---

## 🚀 When *Would* I Ever Have to Pay?
You would only need to pay if you decide to turn APEX into a commercial, public startup with thousands of users. If you do that, you would need to:
1. **Set up a Central Database**: Pay for a hosted database (like AWS or Supabase Pro) to manage shared user profiles ($10 - $25/month).
2. **Verify Google App**: Pay a one-time verification fee if you want to remove the "App not verified" warning for commercial public users.
3. **Custom Domain**: Pay for a custom domain name (e.g. `apexworkout.com`, ~$12/year).

As long as this project remains your personal summer workout helper, **you will never receive a bill.**

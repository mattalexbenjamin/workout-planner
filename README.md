# APEX Summer '26 | Athletic Recommender & PWA Tracker

An adaptive, mobile-first Progressive Web Application (PWA) designed to prepare you for sand volleyball, flag football, weightlifting, and running during the summer of 2026. 

APEX is a zero-dependency, client-side application that integrates with your personal schedule, daily recovery stats, and cutting-edge AI to suggest the optimal daily training session.

---

## ⚡ Key Features

* **🤖 Gemini AI Coach**: Generates fully custom, on-the-fly workouts using Google's Gemini AI directly in your browser. Features individual exercise "re-rolling" to instantly swap out movements. Adapts sets, reps, and exercise selection to your exact equipment, schedule, and fatigue levels.
* **✨ Deep Athletic Insights**: An ML-driven feature that analyzes your historical data (volume trends, hypertrophy sweet spots, and readiness scores) to provide personalized, natural language insights about your athletic journey.
* **🏆 Gamification Trophy Room**: A dynamic achievements engine that tracks consistency and sports-specific volume, unlocking beautifully designed metallic badges (Bronze through Diamond) as you hit major milestones.
* **📊 Advanced Lifting Analytics**: Interactive Chart.js visualizations that track Volume Load (Sets x Reps x Weight) over time for your top exercises and analyze your training zones with Rep Range Distribution charts (Heavy, Hypertrophy, Endurance).
* **🏋️‍♂️ 20 Elite Curated Workouts**: A comprehensive built-in catalog of expertly programmed workouts divided evenly across Weightlifting, Running, Volleyball, Flag Football, and Recovery.
* **📅 Smart Calendar Recommendations**: Integrates in real-time with your Google Calendar. It adapts your schedule automatically (e.g. recommending dynamic joint prehab on game days, avoiding leg-heavy plyometrics the day before match play, or suggesting express conditioning on busy workdays).
* **☁️ Google Drive Cloud Sync**: Uses your personal Google sign-in to securely store and sync your workouts in a hidden file (`apex_workout_data.json`) on your Google Drive. Allows seamless backup and sync across your computer and iPhone.
* **🔋 Fatigue & Soreness Feedback Loop**: Tracks Legs, Shoulders, and Core soreness alongside Overall Fatigue dynamically. High soreness levels temporarily block heavy loading in fatigued muscle groups and redirect recommendations to recovery protocols.
* **📱 Installable Mobile PWA**: Native-feeling iOS Web App support. Launch APEX in full-screen standalone mode with its own splash screen directly from your phone.
* **🎬 Dynamic Form Guides**: Quick-access video links next to each exercise that load curated tutorials or live YouTube form guide searches.

---

## 🚀 How to Set Up the Application

### 1. Developer One-Time Setup (GitHub Pages & OAuth)
1. Push this directory's files to a free repository on GitHub.
2. In your repository, go to **Settings** -> **Pages**. Under **Branch**, select `main` and root (`/`), then click **Save**. GitHub will give you a public link (e.g., `https://<username>.github.io/workout-planner/`).
3. Open the [Google Cloud Console](https://console.cloud.google.com/), select your project, and edit your **OAuth 2.0 Client ID**.
4. Under **Authorized JavaScript Origins**, add your GitHub Pages URL (`https://<username>.github.io`) and click Save.

### 2. PC Setup
1. Open your published GitHub Pages URL in Google Chrome or Microsoft Edge.
2. Go to the **Settings** tab in the app.
3. Paste in your **Google Client ID**.
4. Click **Sign In with Google** and check the box to authorize Google Drive access. 
5. Your data will instantly sync to the cloud and be available on any device!

### 3. iPhone Setup (PWA Installation)
1. Open your GitHub Pages URL in **Safari** on your iPhone.
2. Tap the **Share** button (the square with an up-arrow) at the bottom of the screen.
3. Scroll down and select **"Add to Home Screen"**. Tap Add.
4. Go to your iPhone home screen and tap the new **APEX** app icon. It will open in full-screen like a native app.
5. Navigate to the **Settings** tab, paste your Client ID, and sign in with Google to sync your data.

---

## 📈 How to Use APEX for the Long Term

To get the most out of APEX over a multi-month training block, follow this workflow:

1. **Log Your Daily Soreness**: Every morning or before you train, adjust the soreness sliders on the Today tab. APEX's recommendation engine relies on this data to protect your joints and intelligently suggest upper vs. lower body days, or active recovery flows.
2. **Sync Your Life**: Connect your Google Calendar so APEX knows when your actual Flag Football games or Volleyball tournaments are happening. APEX will automatically prescribe tapering or warm-up protocols the day before and the day of big events.
3. **Follow the Recommendations**: The "Start Recommended Workout" button is your daily driver. It looks at your fatigue, schedule, and recent workout history to pick the absolute best option from your 20 curated workouts.
4. **Use the AI Coach for Variety**: If the recommendation isn't what you're looking for, or if you only have a 20lb dumbbell and 15 minutes, click the **AI Coach** badge. Gemini will generate a custom, medically-sound workout instantly that still respects your current fatigue levels.
5. **Log Custom Sports**: Whenever you play basketball, tennis, or go hiking, log it via the "Log Custom Sport/Lift" button. This tracks your athletic volume over time and informs future recommendations.

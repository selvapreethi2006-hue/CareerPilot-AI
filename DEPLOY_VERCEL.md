# Deploying CareerPilot AI to Vercel with Real Supabase Authentication

CareerPilot AI is pre-configured for full-stack deployment on Vercel with real Supabase authentication, strict email verification gating, and server-side Gemini 3.8 Flash inference.

---

## ⚡ Option 1: Direct Vercel Deployment via Git (Recommended)

### 1. Push your code to GitHub
```bash
git init
git add .
git commit -m "CareerPilot AI: Real Supabase Auth & Route Protection"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/careerpilot-ai.git
git push -u origin main
```

### 2. Import into Vercel
1. Open [https://vercel.com/new](https://vercel.com/new).
2. Click **Import** next to your GitHub repository `careerpilot-ai`.
3. Vercel automatically detects the Vite configuration and `vercel.json`.

### 3. Add Environment Variables in Vercel
Before clicking Deploy, expand **Environment Variables** and enter:

| Variable Name | Value | Purpose |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | `AIzaSy...` | Required for Gemini 3.8 Flash ATS diagnostics & cover letters |
| `VITE_SUPABASE_URL` | `https://your-ref.supabase.co` | Your Supabase project URL (Project Settings > API) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` or anon JWT | Public publishable or anon key (NEVER secret service_role) |

4. Click **Deploy**. Vercel will build and assign you a live `https://careerpilot-ai.vercel.app` URL.

---

## ⚙️ Supabase Dashboard Configuration (Crucial for Email Verification)

To allow Supabase confirmation links to redirect back to your deployed Vercel site:

1. Open your **Supabase Dashboard** -> **Authentication** -> **URL Configuration**.
2. Set **Site URL** to your Vercel URL:
   ```
   https://your-app-name.vercel.app
   ```
3. In **Redirect URLs**, add:
   ```
   https://your-app-name.vercel.app/**
   http://localhost:3000/**
   ```
4. Save changes.

---

## 🧪 How to Test Real Signup & Login on Vercel

1. **Test Registration**:
   - Open your deployed Vercel website.
   - Click **Sign Up** in the header.
   - Enter your real email address, password (minimum 6 characters), and full name.
   - Click **Register & Send Verification Link**.

2. **Verify Email Gating**:
   - Notice the screen transitions to **"Email Verification Required"**.
   - If you attempt to access the dashboard without confirming, access is strictly blocked.
   - If you attempt to sign in with an unverified email, the app shows:
     *"Email verification is required before signing in. Please check your inbox for the confirmation link."*

3. **Confirm Email**:
   - **Method A (Real Email)**: Open your email inbox (or spam folder) and click the confirmation link sent by Supabase.
   - **Method B (Supabase Studio for testing)**: Go to **Supabase Dashboard > Authentication > Users**, find your email, click the three dots (`...`), and select **"Confirm user"**.

4. **Test Real Sign In**:
   - Return to your Vercel site, click **Sign In**.
   - Enter your email and password.
   - You are securely logged in: your user ID, name, and email appear in the top bar with a **VERIFIED CLOUD** badge.
   - Your resumes, job matches, and application pipelines are stored under your unique Supabase `user_id`.

5. **Test Sign Out**:
   - Open the user dropdown and click **Sign Out**.
   - You are instantly signed out and redirected to the public landing page. Private workspace routes require signing in again.

---

## 🌐 Instant Cloud Run Link (Active Now)
- **Live URL:** [https://ais-pre-vlzl7zwiz7j56bcx5gjmma-565839048771.asia-southeast1.run.app](https://ais-pre-vlzl7zwiz7j56bcx5gjmma-565839048771.asia-southeast1.run.app)

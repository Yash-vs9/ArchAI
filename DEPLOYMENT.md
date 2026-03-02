# DevArchitect AI — Deployment Guide

## Overview

| What | Where | Cost |
|---|---|---|
| Next.js Frontend + NextAuth | Vercel | Free |
| Socket.IO Backend | Render | Free |
| Keep-alive pinger | UptimeRobot | Free |

---

## Step 1 — Prepare Your Code

### 1.1 Update the socket URL in `ChatPanel.tsx`

Find this line:
```ts
const socket = io("http://localhost:3001", {
```

Replace with:
```ts
const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001", {
```

### 1.2 Make sure your root `package.json` has a backend start script

Open your root `package.json` and make sure it has:
```json
{
  "scripts": {
    "dev": "concurrently \"next dev\" \"npx ts-node -O '{\\\"module\\\":\\\"commonjs\\\"}' server/index.ts\"",
    "start": "next start",
    "build": "next build",
    "start:server": "npx ts-node -O '{\"module\":\"commonjs\"}' server/index.ts"
  }
}
```

### 1.3 Commit everything to GitHub

```bash
git add .
git commit -m "feat: ready for deployment"
git push origin main
```

---

## Step 2 — Deploy Backend to Render

### 2.1 Create a Render account

Go to [render.com](https://render.com) → Sign up with GitHub (easier — it can access your repo directly)

### 2.2 Create a new Web Service

1. Click **New +** → **Web Service**
2. Click **Connect a repository** → select your ArchAI repo
3. Fill in the settings exactly:

```
Name:             archai-backend
Region:           Singapore (closest to India) or Oregon
Branch:           main
Root Directory:   (leave completely empty)
Runtime:          Node
Build Command:    npm install
Start Command:    npx ts-node -O '{"module":"commonjs"}' server/index.ts
```

4. Scroll down to **Instance Type** → select **Free**

### 2.3 Add environment variables

Scroll down to **Environment Variables** → click **Add Environment Variable** for each:

```
GROQ_API_KEY          →  your Groq API key
NODE_ENV              →  production
NEXTAUTH_URL          →  https://your-app.vercel.app  (fill this AFTER step 3)
```

> Leave NEXTAUTH_URL blank for now — come back and fill it after Vercel deploy

### 2.4 Deploy

Click **Create Web Service** — Render will start building. Wait 3-5 minutes.

### 2.5 Get your backend URL

Once deployed, Render shows your URL at the top:
```
https://archai-backend.onrender.com
```

Copy this — you need it in the next step.

### 2.6 Test it

Open in your browser:
```
https://archai-backend.onrender.com/health
```

You should see: `{"status":"ok"}`

---

## Step 3 — Deploy Frontend to Vercel

### 3.1 Create a Vercel account

Go to [vercel.com](https://vercel.com) → Sign up with GitHub

### 3.2 Import your project

1. Click **Add New** → **Project**
2. Select your ArchAI GitHub repo → click **Import**
3. Vercel auto-detects Next.js — leave all framework settings as default

### 3.3 Add environment variables

Before clicking Deploy, scroll down to **Environment Variables** and add all of these:

```
NEXTAUTH_URL              →  https://archai-xyz.vercel.app
                              (Vercel shows your URL above — use that)

NEXTAUTH_SECRET           →  generate one by running this in your terminal:
                              node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

NEXT_PUBLIC_BACKEND_URL   →  https://archai-backend.onrender.com
                              (the URL from Step 2.5)

GROQ_API_KEY              →  your Groq API key

GOOGLE_CLIENT_ID          →  your Google OAuth client ID
GOOGLE_CLIENT_SECRET      →  your Google OAuth client secret
```

### 3.4 Deploy

Click **Deploy** — wait 2-3 minutes.

### 3.5 Get your frontend URL

Vercel gives you a URL like:
```
https://archai-xyz.vercel.app
```

Copy this.

---

## Step 4 — Update Render with your Vercel URL

1. Go back to [render.com](https://render.com) → your archai-backend service
2. Click **Environment** in the left sidebar
3. Find `NEXTAUTH_URL` → click edit → paste your Vercel URL:
```
https://archai-xyz.vercel.app
```
4. Click **Save Changes** → Render auto-redeploys (wait 2 min)

---

## Step 5 — Update OAuth Callback URLs

### If using Google OAuth

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. APIs & Services → Credentials → click your OAuth 2.0 Client
3. Under **Authorized redirect URIs** → click **Add URI** → paste:
```
https://archai-xyz.vercel.app/api/auth/callback/google
```
4. Click **Save**

### If using GitHub OAuth

1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. Click your OAuth App
3. Update both fields:
```
Homepage URL:         https://archai-xyz.vercel.app
Authorization callback URL: https://archai-xyz.vercel.app/api/auth/callback/github
```
4. Click **Update application**

---

## Step 6 — Set Up UptimeRobot (Prevent Cold Starts)

### 6.1 Create account

Go to [uptimerobot.com](https://uptimerobot.com) → Sign up free

### 6.2 Add monitor

1. Click **Add New Monitor**
2. Fill in:
```
Monitor Type:   HTTP(s)
Friendly Name:  ArchAI Backend
URL:            https://archai-backend.onrender.com/health
Monitoring Interval: Every 14 minutes
```
3. Click **Create Monitor**

Done. Your server will now never sleep.

---

## Step 7 — Final Checks

### 7.1 Test the full flow

1. Open `https://archai-xyz.vercel.app`
2. Sign in with Google/GitHub
3. Start the interview
4. Complete all 14 questions
5. Verify architecture generates and canvas updates
6. Click Dev Guide tab
7. Click Scaffold Repo

### 7.2 Test backend is warm

```
https://archai-backend.onrender.com/health
```
Should respond instantly with `{"status":"ok"}`

### 7.3 Check browser console

Open DevTools → Console. You should NOT see any:
- CORS errors
- Socket connection errors
- 401 auth errors

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `CORS error` on socket | Make sure `NEXTAUTH_URL` on Render matches your Vercel URL exactly, no trailing slash |
| `Auth callback error` | Double check OAuth redirect URI matches Vercel URL exactly |
| `Socket not connecting` | Check `NEXT_PUBLIC_BACKEND_URL` in Vercel env vars has no trailing slash |
| `Build failed on Vercel` | Check build logs — usually a missing env var or TypeScript error |
| `Build failed on Render` | Make sure `npm install` runs without errors locally first |
| `Architecture not generating` | Check `GROQ_API_KEY` is set correctly on both Vercel and Render |
| Backend returns 502 | Render is still deploying — wait 2 more minutes and refresh |

---

## Your Final URLs

After completing all steps, you'll have:

```
Frontend:   https://archai-xyz.vercel.app
Backend:    https://archai-backend.onrender.com
Health:     https://archai-backend.onrender.com/health
```

Share the frontend URL with your hackathon judges. 🚀

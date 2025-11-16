# Deployment Guide - The Never Ending War

## Quick Answer: Do I need to deploy the backend?

**For local testing:** No - you can deploy just the frontend to Vercel and keep the backend running locally. However, only YOU will be able to use the app (since the backend is on your computer).

**For production (public access):** Yes - both frontend AND backend need to be deployed to cloud servers so anyone can access them.

---

## Option 1: Frontend Only (Testing)

### Use Case
- You want to see your site live
- Only you will use it (backend on your PC)
- Testing deployment process

### Limitations
- Backend must be running on your PC
- Only works on your network/VPN
- Not accessible to others

### Steps
1. Deploy frontend to Vercel (see Frontend Deployment below)
2. Set `VITE_API_URL=http://localhost:3001`
3. Keep backend running locally

---

## Option 2: Full Production Deployment

### Use Case
- Make game available to Twitch viewers
- Public access 24/7
- Professional deployment

### Required Components
1. **Frontend:** Vercel (React app)
2. **Backend:** Railway/Render (Express API)
3. **Database:** Firebase (already cloud-hosted ✓)

---

# Frontend Deployment (Vercel)

## Prerequisites
- GitHub account connected to Vercel ✓
- `IdleDnD-Web` repository pushed to GitHub

## Step-by-Step

### 1. Import Project
- On Vercel dashboard, click **"Add New Project"**
- Click **"Import"** next to your `IdleDnD-Web` repository
- Click **"Import"**

### 2. Configure Build Settings

**Framework Preset:** Vite (should auto-detect)

**Root Directory:** 
- If separate repo: `.` (leave empty)
- If monorepo: `IdleDnD-Web`

**Build Settings:**
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### 3. Environment Variables

Click **"Environment Variables"** and add these ONE BY ONE:

#### Required for Basic Functionality
```
VITE_API_URL
Value: http://localhost:3001
(Change to your backend URL once deployed)

VITE_TWITCH_CLIENT_ID
Value: [Your Twitch Client ID from dev.twitch.tv]

VITE_TWITCH_REDIRECT_URI
Value: https://your-app-name.vercel.app/auth/callback
(You'll get the exact URL after first deployment)
```

#### Required for Quests & Real-time Features
Get these from: Firebase Console → Project Settings → General → Your apps → Web app config

```
VITE_FIREBASE_API_KEY
Value: [From Firebase Console]

VITE_FIREBASE_AUTH_DOMAIN
Value: your-project-id.firebaseapp.com

VITE_FIREBASE_PROJECT_ID
Value: your-project-id

VITE_FIREBASE_STORAGE_BUCKET
Value: your-project-id.appspot.com

VITE_FIREBASE_MESSAGING_SENDER_ID
Value: [From Firebase Console]

VITE_FIREBASE_APP_ID
Value: [From Firebase Console]
```

### 4. Deploy

Click **"Deploy"**

Wait 2-3 minutes for build to complete.

### 5. Post-Deployment

After successful deployment:

1. **Copy your Vercel URL** (e.g., `https://idle-dnd.vercel.app`)

2. **Update Twitch OAuth Redirect:**
   - Go to: https://dev.twitch.tv/console/apps
   - Edit your application
   - Add OAuth Redirect URL: `https://your-vercel-url.vercel.app/auth/callback`
   - Save

3. **Update Environment Variable:**
   - Go back to Vercel → Project Settings → Environment Variables
   - Edit `VITE_TWITCH_REDIRECT_URI`
   - Change to your actual Vercel URL + `/auth/callback`
   - **Redeploy** (Vercel → Deployments → Three dots → Redeploy)

---

# Backend Deployment (Railway - Recommended)

## Why Railway?
- Easy setup for Node.js/Express
- Free tier available
- Persistent servers (not serverless)
- Built-in databases if needed

## Step-by-Step

### 1. Sign Up
- Go to https://railway.app
- Sign in with GitHub

### 2. New Project
- Click **"New Project"**
- Select **"Deploy from GitHub repo"**
- Choose **`IdleDnD-Backend`** repository

### 3. Configure

**Root Directory:** (leave empty or set to `IdleDnD-Backend` if monorepo)

**Build Command:** (leave empty, Railway auto-detects)

**Start Command:** `npm start`

### 4. Environment Variables

Railway → Your Project → Variables tab

Add all from your `.env` file:

```
PORT=3001

# Firebase Admin (from serviceAccountKey.json)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Twitch OAuth
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret
TWITCH_REDIRECT_URI=https://your-vercel-app.vercel.app/auth/callback

# JWT
JWT_SECRET=your_random_secret_key_here

# CORS
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,http://localhost:3000

NODE_ENV=production
```

### 5. Deploy

Railway will auto-deploy. You'll get a URL like:
`https://idlednd-backend-production.up.railway.app`

### 6. Update Frontend

Go back to Vercel:
- Project Settings → Environment Variables
- Edit `VITE_API_URL`
- Change to your Railway backend URL
- Redeploy

---

# Backend Deployment Alternative (Render.com)

Very similar to Railway, also free tier:

1. Go to https://render.com
2. New → Web Service
3. Connect GitHub repo `IdleDnD-Backend`
4. Settings:
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add environment variables (same as Railway)
6. Deploy

---

# Deployment Checklist

## Before Deploying

- [ ] Push latest code to GitHub
- [ ] Have Firebase credentials ready
- [ ] Have Twitch Client ID and Secret
- [ ] Test locally first

## Frontend Deployment

- [ ] Deploy to Vercel
- [ ] Add environment variables
- [ ] Get Vercel URL
- [ ] Update Twitch OAuth redirect URL
- [ ] Update `VITE_TWITCH_REDIRECT_URI` env var
- [ ] Redeploy

## Backend Deployment (Optional but recommended for production)

- [ ] Choose platform (Railway/Render)
- [ ] Deploy backend
- [ ] Add all environment variables
- [ ] Get backend URL
- [ ] Update frontend `VITE_API_URL`
- [ ] Update CORS allowed origins in backend
- [ ] Test API endpoints

## Post-Deployment Testing

- [ ] Visit your Vercel URL
- [ ] Test Twitch login
- [ ] Create a hero
- [ ] Check if backend API calls work
- [ ] Test real-time features (quests, raids)
- [ ] Play Electron app, verify website syncs

---

# Common Issues & Solutions

## "Failed to fetch" errors
- **Cause:** Backend not deployed or wrong `VITE_API_URL`
- **Fix:** Check backend is running, verify URL in env vars

## Twitch OAuth fails
- **Cause:** Redirect URI mismatch
- **Fix:** Ensure Twitch app settings match your Vercel URL exactly

## Environment variables not working
- **Cause:** Didn't redeploy after adding env vars
- **Fix:** Vercel → Deployments → Redeploy (environment changes require rebuild)

## Firebase errors
- **Cause:** Missing Firebase env vars
- **Fix:** Add all 6 Firebase variables from console

## CORS errors
- **Cause:** Backend blocking frontend domain
- **Fix:** Add your Vercel URL to `ALLOWED_ORIGINS` in backend env

---

# Cost Estimates

## Free Tier (Suitable for starting out)

- **Vercel:** Free (100GB bandwidth, unlimited deployments)
- **Railway:** Free $5/month credit (enough for small backend)
- **Render:** Free (spins down after inactivity)
- **Firebase:** Free (Spark plan - 50k reads, 20k writes per day)

**Total: $0/month** for hobby/testing

## Paid Tier (If you grow)

- **Vercel Pro:** $20/month (more bandwidth)
- **Railway:** $5-20/month (always-on server)
- **Firebase:** Pay-as-you-go (scales with users)

---

# Local Development vs Production

## Local Setup (What you have now)
```
Frontend: http://localhost:3000 (Vite dev server)
Backend:  http://localhost:3001 (Express server)
Database: Firebase Cloud (already cloud ✓)
```

## Production Setup (After deployment)
```
Frontend: https://your-app.vercel.app (Vercel CDN)
Backend:  https://your-backend.railway.app (Railway server)
Database: Firebase Cloud (same database ✓)
```

---

# Quick Start (Minimal Deployment)

If you just want to see it live quickly:

1. **Vercel Only** (5 minutes)
   - Deploy frontend to Vercel
   - Set `VITE_API_URL=http://localhost:3001`
   - Keep backend running locally
   - Share Vercel URL with friends (they won't be able to login, but can see the site)

2. **Full Deployment** (30 minutes)
   - Deploy frontend to Vercel
   - Deploy backend to Railway
   - Update all URLs
   - Fully functional for everyone

---

# Need Help?

If you get stuck:
1. Check the error message in browser console (F12)
2. Check Vercel build logs
3. Check Railway/Render logs
4. Verify environment variables are set correctly
5. Make sure all URLs match (no http vs https mismatches)

---

# What's Next After Deployment?

Once deployed:
- Stream with Twitch integration working
- Viewers can join via website
- Quest system tracks real-time
- Raids and world bosses sync automatically
- Professional MMO experience! 🎮

**Take your time, deploy when you're ready. The local setup works great for development!**

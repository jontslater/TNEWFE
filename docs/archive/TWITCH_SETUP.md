# Twitch OAuth Setup Guide

This guide will help you set up Twitch authentication for The Never Ending War.

## Step 1: Create a Twitch Application

1. Go to [Twitch Developer Console](https://dev.twitch.tv/console/apps)
2. Log in with your Twitch account
3. Click **"Register Your Application"**
4. Fill in the following:
   - **Name:** The Never Ending War (or any name you prefer)
   - **OAuth Redirect URLs:**
     - For local development: `http://localhost:3000/auth/callback`
     - For production: `https://theneverendingwar.com/auth/callback`
     - **Note:** Add both if you want to test locally and deploy to production
   - **Category:** Game Integration
5. Click **"Create"**
6. Click **"Manage"** on your new application
7. Copy the **Client ID** (you'll need this in the next step)

## Step 2: Configure Environment Variables

### For Local Development

1. Create a `.env.local` file in the root of your project:

```bash
# In the project root
touch .env.local  # On Windows, just create the file
```

2. Add the following content to `.env.local`:

```env
# API Configuration
VITE_API_URL=http://localhost:3001
VITE_USE_MOCK=true

# Twitch OAuth Configuration
VITE_TWITCH_CLIENT_ID=YOUR_CLIENT_ID_HERE
VITE_TWITCH_REDIRECT_URI=http://localhost:3000/auth/callback
```

3. Replace `YOUR_CLIENT_ID_HERE` with the Client ID from Step 1

### For Production (Vercel)

1. Go to your Vercel project dashboard
2. Navigate to **Settings** > **Environment Variables**
3. Add the following variables:
   - `VITE_TWITCH_CLIENT_ID`: Your Twitch Client ID
   - `VITE_TWITCH_REDIRECT_URI`: `https://theneverendingwar.com/auth/callback`
   - `VITE_API_URL`: Your backend API URL (when ready)
   - `VITE_USE_MOCK`: `true` (until backend is deployed)

## Step 3: Test the Login

1. Start your development server:

```bash
npm run dev
```

2. Open http://localhost:3000
3. Click **"Login with Twitch"**
4. You should be redirected to Twitch to authorize the app
5. After authorization, you'll be redirected back to your app

## Troubleshooting

### "Twitch login is not configured" Alert

- Make sure you created the `.env.local` file
- Verify the file is in the project root directory
- Check that `VITE_TWITCH_CLIENT_ID` is set correctly
- Restart the dev server after creating/modifying the `.env.local` file

### Redirect URI Mismatch Error

- Ensure the redirect URI in your `.env.local` matches exactly what you configured in the Twitch Developer Console
- Check for typos (http vs https, trailing slashes, etc.)
- Make sure you added http://localhost:3000/auth/callback to your Twitch app's OAuth Redirect URLs

### Nothing Happens After Login

- Check the browser console for errors
- Verify your backend API is running (if not using mock data)
- Ensure CORS is properly configured on your backend

### State Mismatch Error

- This is a security feature to prevent CSRF attacks
- Clear your browser's sessionStorage and try again
- If the problem persists, try a different browser or incognito mode

## Backend Integration

Currently, the app expects a backend endpoint at `/api/auth/twitch` that:

1. Accepts a POST request with the authorization code
2. Exchanges the code for an access token with Twitch
3. Fetches the user's Twitch profile
4. Creates/updates the user in your database
5. Returns a JWT token and user data

Example backend endpoint structure:

```typescript
POST /api/auth/twitch
Body: { code: "authorization_code_from_twitch" }
Response: { 
  user: { id: string, twitchUsername: string, ... },
  token: "your_jwt_token"
}
```

Until you have a backend, the authentication will fail at the token exchange step. Consider setting up the backend following the guides in the `docs/` folder.

## Security Notes

- **Never commit `.env.local` to Git** - it's already in `.gitignore`
- Keep your Client ID secret (though it's okay to expose in frontend code)
- **Never expose your Client Secret** - this should only be used on the backend
- The OAuth flow uses state parameter for CSRF protection
- Always use HTTPS in production

## Next Steps

1. Set up Firebase backend (see `docs/BACKEND_OPTION_1_FIREBASE.md`)
2. Implement the `/api/auth/twitch` endpoint
3. Deploy to Vercel
4. Configure production environment variables
5. Test the full authentication flow

## Support

For issues:
- Check the browser console for error messages
- Review Twitch Developer Console logs
- Ensure all environment variables are set correctly
- Try clearing browser cache and sessionStorage

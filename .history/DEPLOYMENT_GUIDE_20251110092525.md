# IdleDnD Website Deployment Guide

## Prerequisites

- Node.js 18+ installed
- Vercel account (free tier works)
- Git repository set up

## Local Development

### 1. Install Dependencies

```bash
cd E:\IdleDnD-Web
npm install
```

### 2. Configure Environment

Create `.env` file:

```env
VITE_API_URL=http://localhost:3001
VITE_USE_MOCK=true
```

### 3. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Building for Production

```bash
npm run build
```

This creates a `dist/` folder with optimized production files.

## Deploy to Vercel

### Option 1: Vercel CLI (Recommended)

1. **Install Vercel CLI:**

```bash
npm install -g vercel
```

2. **Login to Vercel:**

```bash
vercel login
```

3. **Deploy:**

```bash
vercel --prod
```

Follow the prompts:
- Set up and deploy: Yes
- Which scope: Your account
- Link to existing project: No (first time)
- Project name: idlednd-web
- Directory: ./
- Override settings: No

### Option 2: Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your Git repository (GitHub/GitLab/Bitbucket)
3. Configure project:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add environment variables:
   - `VITE_API_URL`: Your production API URL (or leave as mock)
   - `VITE_USE_MOCK`: `true` (until backend is ready)
5. Click "Deploy"

## Custom Domain

Your domain: **theneverendingwar.com**

1. Go to your Vercel project settings
2. Navigate to "Domains"
3. Add your custom domain:
   - Main site: `theneverendingwar.com` and `www.theneverendingwar.com`
4. Update DNS records at your domain registrar as instructed by Vercel:
   - **A Record:** Point to Vercel's IP (76.76.21.21)
   - **CNAME Record:** `www` → `cname.vercel-dns.com`
5. Wait for DNS propagation and SSL certificate to be issued (automatic, usually 5-10 minutes)

## Environment Variables

Update in Vercel dashboard under Settings > Environment Variables:

**Development:**
```
VITE_API_URL=http://localhost:3001
VITE_USE_MOCK=true
```

**Production:**
```
VITE_API_URL=https://api.theneverendingwar.com
VITE_USE_MOCK=false
VITE_FIREBASE_API_KEY=your_key_here
VITE_TWITCH_CLIENT_ID=your_client_id
```

## Connecting to Backend

Once you have a backend deployed:

1. Update `VITE_API_URL` in Vercel environment variables
2. Set `VITE_USE_MOCK=false`
3. Redeploy the website
4. Test all API endpoints

## Continuous Deployment

Vercel automatically deploys:
- **Production:** When you push to `main` branch
- **Preview:** For pull requests and other branches

## Monitoring

- **Analytics:** Enabled by default in Vercel
- **Error Tracking:** Consider adding Sentry
- **Performance:** Use Vercel Speed Insights

## Troubleshooting

### Build Fails

- Check Node.js version (must be 18+)
- Ensure all dependencies are in `package.json`
- Check build logs in Vercel dashboard

### API Calls Failing

- Verify `VITE_API_URL` is correct
- Check CORS settings on backend
- Ensure SSL certificates are valid

### Routing Issues

- Add `vercel.json` for SPA routing:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## Security

- **HTTPS Only:** Enforced by Vercel
- **API Keys:** Never commit to Git, use environment variables
- **CORS:** Configure backend to only allow theneverendingwar.com
- **Rate Limiting:** Implement on backend to prevent abuse

## Performance Optimization

- **Code Splitting:** Automatic with Vite
- **Image Optimization:** Use Vercel Image Optimization
- **Caching:** Configured automatically
- **CDN:** Global CDN included with Vercel

## Cost

- **Free Tier:**
  - 100 GB bandwidth/month
  - Unlimited deployments
  - SSL certificates
  - Custom domains
  
- **Pro Tier ($20/month):**
  - 1 TB bandwidth
  - Faster builds
  - Team collaboration
  - Advanced analytics

## Next Steps

1. Deploy website to Vercel
2. Set up Firebase backend (see `docs/BACKEND_OPTION_1_FIREBASE.md`)
3. Implement Twitch OAuth authentication
4. Deploy Twitch Extension
5. Connect everything together

## Support

For deployment issues:
- Vercel Documentation: https://vercel.com/docs
- Vite Documentation: https://vitejs.dev/guide/
- GitHub Issues: Create an issue in your repository

# The Never Ending War - Player Portal

A React-based web portal for "The Never Ending War", a Twitch auto-battler game where viewers manage heroes, gear, professions, guilds, and raids. Includes OBS browser-source overlays for streamers.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Backend API**: Firebase Firestore + REST API (separate backend repo: `jontslater/idleDnD-Backend`)
- **Payments**: Stripe (Founders Packs, Token Purchases)
- **Authentication**: Twitch OAuth, TikTok OAuth

## Features

### Player Portal
- **Hero Management**: Dashboard, stats, equipment, inventory
- **Professions**: Herbalism, Mining, Enchanting with gathering and crafting
- **Guild System**: Create/join guilds, guild bank, raids, roster management
- **Raid Scheduling**: Daily, weekly, monthly raids with signup system
- **Quests**: Daily/weekly/monthly objectives with rewards
- **Store**: Gold purchases (buffs, upgrades), Token purchases, Founders Packs
- **Auction House**: Player-to-player item trading
- **Mail System**: In-game mail with item attachments
- **Achievements & Leaderboards**: Track progress and compete

### Browser Source Overlays (OBS)
- **Unified Browser Source** (`/browser-source-unified`): Real-time hero display with:
  - Adventure mode (auto-combat with enemy spawns)
  - Dungeon mode (instanced dungeon runs)
  - Raid mode (scheduled raid encounters)
  - Live HP bars, animations, spell effects, damage numbers
  - Boss health bars, wave announcements
- **Configuration Page** (`/browser-source/config`): Customize overlay positioning and appearance

## Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```bash
# API Backend URL
VITE_API_URL=http://localhost:3001

# Firebase Configuration (from Firebase Console)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Stripe (for payments)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Optional
VITE_USE_MOCK=false  # Set to 'true' to use mock data instead of API
VITE_WEB_URL=http://localhost:5173
```

**⚠️ IMPORTANT**: Never commit `.env` files to git. Add `.env*` to `.gitignore`.

### Firestore Security Rules

Before deploying to production, deploy the Firestore security rules:

```bash
firebase deploy --only firestore:rules
```

The `firestore.rules` file contains least-privilege access patterns. **Review and customize** the rules based on your authentication mechanism before deploying.

### Scripts

```bash
# Development server (http://localhost:5173)
npm run dev

# Type check (no emit)
npm run build:check

# Production build
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Project Structure

```
src/
├── api/              # API client and mock data
├── components/       # Reusable React components
├── hooks/            # Custom React hooks (auth, heroes, sync, etc.)
├── pages/            # Route page components
├── services/         # External services (Stripe, OAuth)
├── types/            # TypeScript type definitions
├── utils/            # Utility functions (combat, sprites, sync, etc.)
├── data/             # Static game data (classes, raids, etc.)
├── App.tsx           # Main app with routing
└── main.tsx          # Entry point

docs/
├── archive/          # Historical docs and planning notes
└── (current docs)    # Architecture, economy, monetization

firestore.rules       # Firestore security rules (MUST REVIEW BEFORE DEPLOY)
```

## Architecture

### Frontend → Backend Communication

1. **HTTP REST API** (`src/api/client.ts`):
   - Hero CRUD operations
   - Quest progress tracking
   - Guild management
   - Purchase initiation
   - Stripe checkout sessions

2. **Firebase Firestore Real-Time Listeners**:
   - Browser source overlays listen to battlefield state
   - Heroes collection for live updates
   - Instances collection for raid/dungeon state

3. **Overlay Sync Strategy**:
   - Overlay accumulates XP/gold/stat changes locally
   - Syncs to backend every 60 seconds with retry logic
   - Flushes pending changes on page hide/close via `sendBeacon`
   - See `src/hooks/useOverlaySync.ts` for implementation

### Security Considerations

⚠️ **Known Issues** (require backend changes):

1. **Raid/Dungeon Completion**: Client currently sends completion results. Move validation to backend.
2. **Quest Progress**: Client increments quest progress. Backend should validate objectives.
3. **Profession Gathering**: Client reports material gains. Backend should calculate server-side.
4. **Firestore Rules**: Review `firestore.rules` before deploying - contains placeholder auth checks.

✅ **Fixed**:
- Stripe checkout no longer accepts client-provided prices (backend looks up from purchase record)
- OAuth tokens are not stored in client-accessible Firestore documents

## Browser Source Setup (for Streamers)

1. Create a hero at `/create-hero` (requires Twitch login)
2. Visit `/browser-source/config` to customize overlay
3. Copy the generated URL
4. In OBS:
   - Add **Browser Source**
   - Paste the URL
   - Set width: `1920`, height: `1080`
   - Check "Shutdown source when not visible"
   - Refresh every 2 seconds (or let it auto-update via Firestore)

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Set environment variables in Vercel dashboard under Project Settings → Environment Variables.

### Other Platforms

Build the app and serve the `dist/` folder:

```bash
npm run build
# Upload dist/ to hosting provider
```

## Backend Repository

The backend API is maintained separately: **[jontslater/idleDnD-Backend](https://github.com/jontslater/idleDnD-Backend)**

Backend must implement:
- Server-side validation of XP/gold gains
- Quest completion verification
- Profession gathering calculations
- Raid/dungeon result validation
- Stripe webhook handling for payment confirmation

## Contributing

This project is currently in active development. When making changes:

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Keep commits logical and well-described
3. Run lint and type checks before committing:
   ```bash
   npm run lint
   npm run build:check
   ```
4. Test browser source overlays in OBS before merging
5. Submit PR with description of changes and any required backend updates

## License

Proprietary - All rights reserved.

## Support

For issues or questions, visit `/report-issue` in the app or contact the development team.

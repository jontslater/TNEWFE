# Real-Time Data Sync Architecture

## How It Works

### Data Flow:

```
┌─────────────────┐
│  Electron App   │ ← Game engine, combat, events
│  (Game Client)  │
└────────┬────────┘
         │ Writes game state
         ↓
┌─────────────────┐
│    Firebase     │ ← Central database (source of truth)
│   (Firestore)   │
└────────┬────────┘
         │ Real-time listeners
         ↓
┌─────────────────┐
│  Web Frontend   │ ← Dashboard, displays data
│ (Player Portal) │
└────────┬────────┘
         │ User actions (equip, craft, guild)
         ↓
┌─────────────────┐
│  Backend API    │ ← Processes actions, validates
│ (Express/Node)  │
└────────┬────────┘
         │ Updates database
         ↓
     Firebase
         ↓
  Electron App (reads updates)
```

## Real-Time Sync Benefits

✅ **No Polling** - Frontend automatically updates when Electron app changes data  
✅ **Instant Updates** - See hero HP, XP, gold changes live  
✅ **Efficient** - Only sends changed data, not full re-fetches  
✅ **Built-in** - Firebase handles all the WebSocket complexity  

## Setup Instructions

### 1. Get Firebase Web Config

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: "the-never-ending-war"
3. Click gear icon ⚙️ > **Project settings**
4. Scroll down to **"Your apps"**
5. If no web app exists, click **"Add app"** > Select **Web** (</>) 
6. Register app (name it "IdleDnD Web")
7. Copy the `firebaseConfig` object

It looks like:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "the-never-ending-war.firebaseapp.com",
  projectId: "the-never-ending-war",
  storageBucket: "the-never-ending-war.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### 2. Add to Frontend .env.local

Add these variables to `E:\IdleDnD-Web\.env.local`:

```env
# Existing variables...
VITE_API_URL=http://localhost:3001
VITE_USE_MOCK=false
VITE_TWITCH_CLIENT_ID=your_twitch_client_id
VITE_TWITCH_REDIRECT_URI=http://localhost:3000/auth/callback

# Firebase Client Config (for real-time sync)
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=the-never-ending-war.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=the-never-ending-war
VITE_FIREBASE_STORAGE_BUCKET=the-never-ending-war.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 3. Update HomePage to Use Real-Time Hook

In `src/pages/HomePage.tsx`, change:

```typescript
// Old:
import { useHero } from '../hooks/useHero';

// New:
import { useHeroRealtime } from '../hooks/useHeroRealtime';

// Old:
const { hero, loading: heroLoading, refetch: refetchHero } = useHero(user?.id || null);

// New:
const { hero, loading: heroLoading, updateHero } = useHeroRealtime(user?.id || null);
```

**Note:** Remove `refetchHero` and replace it with `updateHero` in the ProfessionPanel component call.

### 4. Restart Frontend

```bash
cd E:\IdleDnD-Web
npm run dev
```

## Testing Real-Time Sync

1. **Open the Web Portal** in your browser
2. **Open the Electron app**
3. **Do something in Electron** that changes your hero (combat, gain XP, spend gold)
4. **Watch the Web Portal** - it should update instantly! 🎉

## When to Use Real-Time vs API Calls

### Use Real-Time Listeners (Firestore):
- ✅ Displaying hero stats (HP, XP, gold, level)
- ✅ Showing guild members/status
- ✅ Viewing raid signups
- ✅ Any **read-only** display data

### Use API Calls (Backend REST):
- ✅ User actions (equip item, craft potion, join guild)
- ✅ Purchases (Bits transactions)
- ✅ Administrative actions
- ✅ Complex **write operations** that need validation

## Security

### Firestore Rules

Update your Firestore security rules to allow authenticated reads:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Heroes - users can read all, write only their own via backend
    match /heroes/{heroId} {
      allow read: if true; // Public read for now
      allow write: if false; // Only backend can write
    }
    
    // Guilds - read all, write via backend
    match /guilds/{guildId} {
      allow read: if true;
      allow write: if false;
    }
    
    // Other collections...
  }
}
```

**Important:** All **writes** should go through your backend API for validation. The frontend only **reads** from Firestore directly.

## Architecture Benefits

1. **Separation of Concerns**
   - Electron = Game logic
   - Backend = Business logic, validation
   - Frontend = Display, UX
   - Firebase = Data persistence

2. **Real-Time Feel**
   - No refresh needed
   - See changes instantly
   - Better UX

3. **Efficient**
   - Only changed fields are transmitted
   - No unnecessary API calls
   - Firebase handles connection management

## Migration Path

You can migrate gradually:
1. Start with `useHeroRealtime` for hero display
2. Create `useGuildRealtime` for guild display
3. Keep API calls for actions (equip, craft, etc.)
4. Eventually all display data uses real-time listeners

## Troubleshooting

### "Permission denied" errors
- Check Firestore security rules
- Make sure reads are allowed

### Data not updating
- Verify Electron app is writing to Firebase
- Check Firebase console to see if data exists
- Look for connection errors in browser console

### Multiple listeners
- Each `useEffect` automatically cleans up its listener
- Don't worry about memory leaks

## Next Steps

1. Add Firebase config to `.env.local`
2. Update `HomePage.tsx` to use `useHeroRealtime`
3. Test with Electron app
4. Create similar hooks for Guild, Raids if needed

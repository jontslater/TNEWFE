# Frontend Environment Variables

Create a `.env` file in the `E:\IdleDnD-Web` directory with the following variables:

```env
# API URL (backend server)
VITE_API_URL=http://localhost:3001

# Web URL (frontend URL for browser source generation)
VITE_WEB_URL=http://localhost:3000

# Use mock data instead of backend API (for development/testing)
# Set to 'true' to use mock data, 'false' or leave empty to use real API
VITE_USE_MOCK=false

# Firebase Configuration (for client-side Firebase SDK)
# These are used by the Firebase client SDK for authentication and Firestore
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## How to Get Firebase Config Values

1. Go to Firebase Console > Project Settings > General
2. Scroll down to "Your apps" section
3. Click on the web app icon (</>) or create a new web app
4. Copy the config values from the Firebase SDK snippet




# The Never Ending War - Player Portal

Web-based player portal for managing heroes, guilds, professions, and raids.

## Features

- Hero Dashboard (stats, equipment, buffs)
- Gear Management (equip, compare, upgrade)
- Profession Management (herbalism crafting, materials)
- Guild System (create, manage, bank, roster)
- Raid Scheduling (daily, weekly, monthly raids)
- World Boss Calendar
- Twitch/TikTok Account Linking

## Tech Stack

- React 18 + TypeScript
- Tailwind CSS
- React Router
- Vite (build tool)
- Axios (API client)

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

Deploy to Vercel:
```bash
vercel --prod
```

## Environment Variables

Create `.env` file:
```
VITE_API_URL=http://localhost:3001
VITE_FIREBASE_API_KEY=your_key_here
# Add more as needed
```

## Project Structure

```
src/
├── components/     # React components
├── hooks/          # Custom hooks
├── api/            # API client and mock data
├── types/          # TypeScript type definitions
├── pages/          # Page components
└── utils/          # Utility functions
```

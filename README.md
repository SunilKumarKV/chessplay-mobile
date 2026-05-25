# ChessPlay Mobile

Native React Native + Expo mobile client for ChessPlay.

This is not a WebView or Capacitor wrapper. It is a TypeScript Expo app with native navigation, secure token storage, TanStack Query data fetching, Zustand state, Socket.IO multiplayer, and local chess move validation with `chess.js`.

## Stack

- Expo SDK 54
- React Native 0.81
- TypeScript
- Expo Router
- TanStack Query
- Zustand
- Expo SecureStore
- socket.io-client
- chess.js

## Setup

```bash
npm install
cp .env.example .env
npm run typecheck
npm run lint
npm start
```

The production defaults are:

```bash
EXPO_PUBLIC_API_URL=https://chessplay-b5ve.onrender.com/api
EXPO_PUBLIC_SOCKET_URL=https://chessplay-b5ve.onrender.com
```

Do not use localhost for production builds.

## Features Implemented

- Splash and onboarding
- Login, register, and forgot-password request
- JWT/session token storage with SecureStore
- Auth-guarded app routes
- Home dashboard
- Local chess board for Play vs AI foundation
- Online matchmaking, create room, join room
- Live chess board with touch selection, legal move highlights, move history, draw offer, resign
- Profile and recent game history
- Leaderboard
- Friends/messages/notifications social hub states
- Puzzle training screen using backend puzzle APIs
- Settings with dark/light theme
- Loading, empty, error, and network failure handling
- EAS-ready config

## Important Backend Notes

The mobile app uses the existing ChessPlay backend as-is. Missing mobile-specific APIs are documented in [docs/api-reference.md](docs/api-reference.md), and implementation sequencing is in [docs/mobile-roadmap.md](docs/mobile-roadmap.md).

## Validation

```bash
npm run typecheck
npm run lint
npx expo config --type public
```

For device testing:

```bash
npm start
```

Then open the app in Expo Go or a development build.


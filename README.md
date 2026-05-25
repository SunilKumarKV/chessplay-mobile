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

`.env.example` intentionally ships with blank values so local and CI environments must choose their target explicitly. Do not use localhost for production builds.

## Features Implemented

- Splash and onboarding
- Login, register, and forgot-password request
- JWT/session token storage with SecureStore
- Auth-guarded app routes
- Home dashboard
- Local chess board for Play vs AI foundation
- Online matchmaking, create room, join room
- Live chess board with touch selection, legal move highlights, move history, draw offer, resign
- Promotion picker for pawn promotion
- Live room chat
- Profile, profile editing, and recent game history
- Leaderboard
- Friends, player search, message threads, and conversation detail
- Puzzle training screen using backend puzzle APIs
- Settings sync with dark/light theme and sound preferences
- Loading, empty, error, and network failure handling
- EAS-ready config

## Important Backend Notes

The mobile app uses the existing ChessPlay backend as-is. Missing mobile-specific APIs are documented in [docs/backend-mobile-gaps.md](docs/backend-mobile-gaps.md), with broader implementation sequencing in [docs/mobile-roadmap.md](docs/mobile-roadmap.md).

## Android Production Build

1. Install EAS CLI if needed:

```bash
npm install -g eas-cli
```

2. Configure the real production environment in your shell or EAS environment:

```bash
export EXPO_PUBLIC_API_URL=https://chessplay-b5ve.onrender.com/api
export EXPO_PUBLIC_SOCKET_URL=https://chessplay-b5ve.onrender.com
```

3. Replace placeholder assets in `assets/` before store submission:

- `assets/icon.png`
- `assets/adaptive-icon.png`
- `assets/splash.png`

4. Validate locally:

```bash
npm run typecheck
npm run lint
npx expo export --platform android --output-dir dist-validation
rm -rf dist-validation
```

5. Build the Android artifact:

```bash
eas build --platform android --profile production
```

6. Submit after Play Console setup:

```bash
eas submit --platform android --profile production
```

The current `app.config.ts` includes a placeholder EAS project id. Run `eas init` for the production Expo account before the first hosted EAS build.

## Validation

```bash
npm run typecheck
npm run lint
npx expo config --type public
npx expo export --platform android --output-dir dist-validation
```

For device testing:

```bash
npm start
```

Then open the app in Expo Go or a development build.

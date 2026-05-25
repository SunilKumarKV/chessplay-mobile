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

## Local Setup

```bash
npm install
cp .env.example .env
```

Set local `.env` values:

```bash
EXPO_PUBLIC_API_URL=https://chessplay-b5ve.onrender.com/api
EXPO_PUBLIC_SOCKET_URL=https://chessplay-b5ve.onrender.com
```

Then validate:

```bash
npm run typecheck
npm run lint
```

`.env.example` intentionally ships with blank values so local and CI environments must choose their target explicitly. Do not use localhost for production builds.

## Expo Go Testing

```bash
npm start
```

Open the project in Expo Go for quick JavaScript-level testing. Use a development build for native behavior that Expo Go does not cover.

## Development Build

Run EAS project setup once before hosted builds:

```bash
npx eas init
```

Build Android development APK:

```bash
npx eas build -p android --profile development
```

Build iOS simulator development app:

```bash
npx eas build -p ios --profile development
```

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

Install EAS CLI if needed:

```bash
npm install -g eas-cli
```

Configure the real production environment in your shell or EAS environment:

```bash
export EXPO_PUBLIC_API_URL=https://chessplay-b5ve.onrender.com/api
export EXPO_PUBLIC_SOCKET_URL=https://chessplay-b5ve.onrender.com
```

Replace placeholder assets in `assets/` before store submission:

- `assets/icon.png`
- `assets/adaptive-icon.png`
- `assets/splash.png`
- `assets/favicon.png`

Validate locally:

```bash
npm run typecheck
npm run lint
npx expo export --platform android --output-dir dist-validation
rm -rf dist-validation
```

Build Android App Bundle:

```bash
npx eas init
npx eas build -p android --profile production
```

Submit after Play Console setup:

```bash
npx eas submit -p android --profile production
```

The production Android profile emits an `.aab`.

## iOS Production Build

An Apple Developer account is required.

```bash
export EXPO_PUBLIC_API_URL=https://chessplay-b5ve.onrender.com/api
export EXPO_PUBLIC_SOCKET_URL=https://chessplay-b5ve.onrender.com
npx eas init
npx eas build -p ios --profile production
```

Then submit to App Store Connect:

```bash
npx eas submit -p ios --profile production
```

See [docs/release-ios.md](docs/release-ios.md) for TestFlight and App Store steps.

## Store Release Docs

- [Google Play release guide](docs/release-playstore.md)
- [iOS release guide](docs/release-ios.md)
- [Privacy policy draft](docs/privacy-policy-draft.md)
- [Store listing draft](docs/store-listing-draft.md)
- [Backend mobile gaps](docs/backend-mobile-gaps.md)

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

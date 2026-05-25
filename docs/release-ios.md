# iOS App Store Release Guide

## Apple Developer Requirement

An active Apple Developer Program account is required for TestFlight and App Store distribution.

## App Store Connect Setup

1. Create a new app in App Store Connect.
2. App name: `ChessPlay`.
3. Bundle ID: `com.devwithsunil.chessplay`.
4. SKU: choose an internal stable identifier such as `chessplay-mobile-ios`.
5. Primary category: Games.

## Bundle Identifier

The Expo config uses:

```text
com.devwithsunil.chessplay
```

Create the matching identifier in Apple Developer if automatic EAS credentials cannot create it.

## Certificates And Signing Overview

EAS can manage iOS credentials automatically when logged in with an Apple Developer account:

```bash
npx eas init
npx eas build -p ios --profile production
```

Manual signing requires:

- iOS distribution certificate
- App Store provisioning profile
- Bundle identifier
- App Store Connect app record

## TestFlight Steps

1. Build production iOS artifact with EAS.
2. Submit to App Store Connect.
3. Wait for processing.
4. Add internal testers.
5. Verify auth, gameplay, sockets, profile, settings, social, and puzzle flows.
6. Add external testers only after internal testing is stable.

## Production Release Steps

1. Complete app listing metadata.
2. Add screenshots for required device sizes.
3. Add privacy policy URL.
4. Complete App Privacy nutrition labels.
5. Submit for review.
6. Release manually after approval or schedule release.


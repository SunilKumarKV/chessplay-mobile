# Release QA Checklist

## Build And Configuration

- `npm run typecheck` passes.
- `npm run lint` passes.
- `npx expo config --type public` renders valid public config.
- `git diff --check` reports no whitespace errors.
- `EXPO_PUBLIC_API_URL` points to the production API domain.
- `EXPO_PUBLIC_SOCKET_URL` points to the production Socket.IO domain.
- No localhost, staging Render URL, private key, database URL, or server secret is committed.
- `app.config.ts` uses package and bundle id `com.devwithsunil.chessplay`.
- EAS project id is configured with `npx eas init` before collecting push tokens in production builds.

## Android Store Readiness

- App Bundle is built with `npx eas build -p android --profile production`.
- Placeholder icon, adaptive icon, and splash are replaced or explicitly approved for v1.0.0.
- Play Console privacy policy URL is live.
- Data Safety form matches final backend behavior.
- Account deletion URL or in-app deletion flow is live.
- Internal testing passes on at least two Android devices.

## iOS Store Readiness

- Bundle id is registered as `com.devwithsunil.chessplay`.
- Apple signing is configured through EAS credentials.
- Face ID usage description is present.
- App Privacy answers match final backend behavior.
- TestFlight testing passes on at least one iPhone.

## Auth And Security

- Login, register, session restore, refresh, logout, and expired-token handling pass on device.
- Logout clears SecureStore tokens and active game recovery storage.
- Biometric unlock can be enabled, disabled, and bypassed only by logging out.
- Private tabs are inaccessible after logout.
- Socket connections are not duplicated after background/foreground cycles.

## Chess And Multiplayer

- Local practice supports legal move generation, promotion, undo, clocks, draw, resignation, and result modal.
- Online room create, join, leave, rejoin, reconnect, chat, draw, resign, timeout, and room closure work against production backend.
- Black orientation taps emit correct backend row/col coordinates.
- Spectator mode is view-only.
- Backend-authoritative multiplayer clocks remain in sync after reconnect.

## Product Areas

- Play vs AI uses backend AI endpoint and clearly marks fallback behavior if Stockfish is unavailable.
- Puzzles load from backend, submit moves, show hints, enforce limits, and record history.
- Profile edit, public profiles, friends, messages, community, leaderboard, settings, tournaments, notifications, support, billing, and referrals handle loading/error/empty states.
- Premium/supporter status is backend-driven and no fake purchase success is shown.

## Native Polish

- Offline banner appears when connectivity is lost.
- Haptics fire on move, capture, check, and illegal move on physical devices.
- Native share works for room invite, profile, referral, and result flows.
- Deep links work for rooms and profiles.
- Password reset and email verification deep links show graceful pending-support messaging if backend completion is not available.
- Push permission is requested only after login.
- Expo push token collection fails gracefully without an EAS project id.
- Accessibility labels exist for buttons, inputs, and board squares.

## Final Smoke Test

1. Fresh install on Android.
2. Register new test account.
3. Complete one local practice game flow.
4. Complete one online room flow with a second device.
5. Complete one AI game.
6. Solve one puzzle.
7. Send one friend request and message.
8. Open Settings, toggle theme/biometric, and log out.
9. Relaunch and verify no private data appears before login.

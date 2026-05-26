# Native Hardening

## Implemented Native Enhancements

- Haptics: chess board selection, normal moves, captures, checks, and illegal selections use Expo Haptics where supported.
- Native share: room invites, public profiles, and game results use the React Native share sheet.
- Deep links: the app recognizes `chessplay://room/:roomId`, `chessplay://profile/:username`, password reset links, and email verification links.
- Biometric unlock: optional local app unlock is available after login when the device has supported biometrics enrolled.
- Foreground/background handling: the app rechecks active rooms on foreground and disconnects stale sockets when no live room is active.
- Offline banner: network state is checked with Expo Network and shown alongside retry/error messaging.
- Push registration: notification permission is requested only after login or from Settings. Expo push tokens are collected only on physical devices with an EAS project id and registered through `POST /api/notifications/device-token`.
- Error boundary: the root layout catches unexpected render errors and provides a restart-safe fallback surface.
- Board performance: chess squares are memoized and expose stable accessibility labels.
- Accessibility: shared buttons and text fields expose labels, and board squares are screen-reader discoverable.

## Deep Link Contract

| Link | Mobile Behavior | Backend Status |
| --- | --- | --- |
| `chessplay://room/:roomId` | Opens Play Online with the room code prefilled. | Supported client-side. |
| `chessplay://profile/:username` | Opens the public profile screen. | Uses existing profile APIs. |
| `chessplay://reset-password?...` | Opens the forgot-password flow with a clear pending-support message. | Mobile reset completion endpoint still needed. |
| `chessplay://verify-email?...` | Opens login with a clear pending-support message. | Mobile email verification completion endpoint still needed. |

## Push Notification Backend Contract

The mobile app registers and revokes Expo push tokens, but push delivery is still intentionally disabled until server-side notification jobs are implemented.

Implemented registration endpoint:

```http
POST /api/notifications/device-token
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "token": "ExponentPushToken[...]",
  "platform": "ios" | "android",
  "deviceId": "stable-mobile-install-id",
  "appVersion": "1.0.0"
}
```

Implemented revoke endpoint:

```http
DELETE /api/notifications/device-token
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "token": "ExponentPushToken[...]",
  "deviceId": "stable-mobile-install-id"
}
```

Remaining notification delivery gaps:

- `GET /api/mobile/notifications/preferences` if notification settings diverge from `/settings/me`.
- Server-side delivery for game invites, move reminders, friend requests, messages, tournaments, and account security alerts.

## Security Review Notes

- Auth tokens remain in SecureStore through the existing auth storage layer.
- Logout clears auth/session storage, active room storage, and native preference storage.
- Private screens continue to rely on the app-level auth guard.
- Socket lifecycle disconnects stale sockets when the app backgrounds without an active live room.
- No Sentry DSN, analytics key, API secret, or push credential is hardcoded. Configure any monitoring provider through environment variables only.

## Error Monitoring Placeholder

No monitoring SDK is enabled yet. When the production provider is chosen, add:

- `EXPO_PUBLIC_SENTRY_DSN=` or equivalent public client DSN.
- A source map upload step in EAS build.
- `captureException` inside `src/components/AppErrorBoundary.tsx`.

Do not commit private auth tokens or server-side monitoring secrets.

## Manual Tests

1. Log in on a physical Android device and verify notification permission is requested only after auth.
2. Toggle biometric unlock in Settings, background the app, foreground it, and confirm device authentication is required.
3. Open `chessplay://room/ABC123` and verify Play Online opens with `ABC123` prefilled.
4. Open `chessplay://profile/demo` and verify the public profile route opens.
5. Disable network and confirm the offline banner appears without crashing protected screens.
6. Share a room code, profile, and game result from their respective screens.
7. Make a normal move, capture, illegal move, and checking move on a real device and verify haptics feel appropriate.

## Remaining Native Release Blockers

- Replace placeholder privacy/support/delete-account URLs with live production pages.
- Add production error monitoring SDK wiring if required by release policy.
- Implement server-side push delivery jobs if push notifications are part of the v1 launch.
- Run physical-device QA on at least one Android phone and one iPhone before store submission.

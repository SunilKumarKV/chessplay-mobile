# Physical Device QA

Run this checklist on production-like builds, not only Expo Go.

## Android Real Device

1. Install a preview or production EAS build.
2. Confirm splash, app icon, adaptive icon, and first launch render correctly.
3. Register and log in with a real test account.
4. Accept or deny notification permission and confirm the app continues either way.
5. If accepted, confirm `POST /api/notifications/device-token` succeeds in backend logs.
6. Enable biometric unlock, background the app, foreground it, and confirm fingerprint/face/device fallback prompt.
7. Verify haptics for move, capture, check, and illegal move.
8. Open `chessplay://room/ABC123` and confirm the Play Online room code is prefilled.
9. Open `chessplay://profile/demo` and confirm public profile navigation.
10. Disable network, confirm offline banner, restore network, and retry a backend screen.
11. Share a room invite and confirm the native share sheet contains the room deep link.
12. Complete one AI game smoke test.
13. Complete one online game against another device.
14. Complete one puzzle and request one hint.
15. Log out and confirm private data is cleared and device token revoke is attempted.
16. Open Settings and verify privacy/delete-account/support links.

## iPhone Real Device

1. Install a TestFlight or EAS internal build.
2. Confirm splash, app icon, safe areas, and first launch render correctly.
3. Register and log in with a real test account.
4. Accept or deny notification permission and confirm the app continues either way.
5. If accepted, confirm `POST /api/notifications/device-token` succeeds in backend logs with `platform: "ios"`.
6. Enable biometric unlock, background the app, foreground it, and confirm Face ID/Touch ID/device fallback prompt.
7. Verify haptics for move, capture, check, and illegal move.
8. Test room/profile deep links from Notes or Safari.
9. Disable network, confirm offline banner, restore network, and retry a backend screen.
10. Share room invite, profile, referral, and result.
11. Complete one AI game smoke test.
12. Complete one online game against another device.
13. Complete one puzzle and request one hint.
14. Log out and confirm private data is cleared and device token revoke is attempted.
15. Open Settings and verify privacy/delete-account/support links.

## Go/No-Go

- Go only when Android and iPhone real-device QA pass without release-blocking auth, socket, push registration, or legal-link failures.
- No-go if legal URLs are not live, if production API env vars are missing, if push token registration fails for accepted permissions, or if logout leaves private data accessible.

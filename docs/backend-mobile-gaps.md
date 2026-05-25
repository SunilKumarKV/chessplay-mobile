# Backend Mobile Gaps

These items should be implemented in the backend before the mobile app is considered fully production-complete. The app currently handles each gap with graceful UI fallback instead of fake production behavior.

## Refresh Token Strategy

The backend refresh flow depends on HttpOnly browser cookies. Native mobile needs a documented refresh token strategy that works outside browser cookie storage, ideally with refresh token rotation and device/session revocation.

## Push Notifications

No mobile push registration or notification feed endpoints were found. Needed endpoints:

- Register/update Expo push token or FCM/APNs token.
- Revoke token on logout.
- Fetch notification feed.
- Mark notifications read.

## Authoritative Timers

Socket room state does not expose authoritative clock ticks or timeout events. Mobile currently displays timer placeholders. Backend should emit clock snapshots and timeout result events.

## Rematch Events

Draw and resign events exist, but rematch request/accept/decline events were not found. Backend should add rematch socket events and new-game linkage.

## Reset-Password Deep Links

`POST /auth/forgot-password` and `POST /auth/reset-password` exist, but reset links target web routes. Mobile needs app-link/universal-link routing and a reset token handoff contract.

## AI Move Service Or Mobile Stockfish Decision

The web app uses Stockfish assets/workers. Mobile needs either:

- A backend AI move endpoint, or
- An approved native/mobile Stockfish integration strategy.

Until then, mobile only provides local move validation for the AI screen foundation.

## Paginated Room Discovery

The `getRooms` socket event returns an in-memory room list. Mobile needs paginated/filterable room discovery for production-scale room browsing and spectating.


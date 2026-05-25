# Testing Checklist

## Static Validation

- `npm install`
- `npm run typecheck`
- `npm run lint`
- `npx expo config --type public`

## Android Smoke Test

- Install Expo Go or a development build.
- Start with `npm start`.
- Confirm splash screen appears.
- Complete onboarding.
- Register or log in with a real backend account.
- Verify SecureStore session restore by closing and reopening the app.
- Open Home, Play, Social, Profile, Settings.
- Toggle dark/light theme.
- Load leaderboard and profile.
- Open game history.
- Start local chess game and confirm legal move highlights.
- Try an illegal move and confirm it is rejected by board state.
- Join online queue with two authenticated devices.
- Create room on one device and join by room code on another.
- Make moves from both devices.
- Offer draw, decline/accept where supported.
- Resign and confirm board state updates.
- Open puzzles and submit a legal candidate move.

## iOS Readiness

- Confirm safe areas on notch devices.
- Confirm SecureStore behavior on cold start.
- Confirm Socket.IO connection on real network.
- Confirm keyboard handling on auth screens.

## Network/Error Cases

- Launch while offline.
- Use expired token.
- Use invalid room code.
- Hit puzzle daily limit.
- Backend returns 429 auth rate limit.
- Socket disconnect/reconnect during active room.


# Mobile Roadmap

## Version 1 Scope

- Native Expo app foundation
- Email auth with SecureStore persistence
- Protected routes
- Home, play, profile, leaderboard, history, social, puzzles, settings
- Socket.IO matchmaking, create room, join room, move, resign, draw offer
- Local chess validation and legal move highlights
- EAS-ready configuration

## Next Backend Tasks

1. Add mobile refresh token support that works without browser cookies.
2. Add push notification device registration and notification feed APIs.
3. Add authoritative clock state to multiplayer rooms.
4. Add rematch socket events and game result summary endpoints.
5. Add mobile reset-password deep links.
6. Add AI move service or approve a mobile Stockfish runtime.
7. Add paginated room discovery.

## Next Mobile Tasks

1. Add a polished result screen fed by live game status and `/games/:id`.
2. Add promotion picker UI instead of defaulting to queen.
3. Add chat panel to live rooms.
4. Add profile editing and settings sync to backend.
5. Add full friends request flow.
6. Add conversation detail and user search.
7. Add push notification permissions after backend token registration exists.
8. Add native app icons and final brand splash assets.
9. Add Detox or Maestro smoke tests for auth and play flows.


# ChessPlay API Reference For Mobile

Reference source: local read-only checkout at `../chessPlay`.

## Frontend Features Identified

- Landing/dashboard shell
- Email auth, Google auth on web, session restore, logout
- AI chess, local chess, online multiplayer, LAN play
- Move history, clocks, captured pieces, board themes, promotion modal, game replay
- Leaderboard and game history
- Profile and settings
- Puzzles with limits, stats, hints, submissions, and history
- Community posts
- Friends and private messages
- Billing/supporter/premium pages
- Admin, automation, feedback, tournaments, analysis, openings, mistakes

## Auth Flow

- `POST /api/auth/register` accepts `username`, `email`, `password`, optional referral code. Returns `user` and `socketToken`.
- `POST /api/auth/login` accepts `email`, `password`. Returns `user` and `socketToken`.
- `GET /api/auth/session` reads bearer/cookie access token and returns `{ user }`.
- `GET /api/auth/socket-token` returns a short-lived Socket.IO token for authenticated users.
- `POST /api/auth/logout` clears server cookies. Mobile also clears SecureStore.
- `POST /api/auth/forgot-password` exists. Mobile deep-link reset completion still needs app-link handling.
- `POST /api/auth/reset-password` exists, but the current mobile app only exposes the request screen.

Mobile stores the returned `socketToken` in SecureStore and sends it as `Authorization: Bearer <token>` for HTTP plus `handshake.auth.accessToken` for Socket.IO.

## Backend API Endpoints Used In Mobile

- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/logout`
- `POST /auth/forgot-password`
- `GET /auth/session`
- `GET /auth/socket-token`
- `GET /profile/me`
- `PATCH /profile/me`
- `GET /games/history`
- `POST /games/record`
- `GET /games/leaderboard`
- `GET /games/:gameId`
- `GET /auth/friends`
- `GET /messages/conversations`
- `GET /messages/users/search`
- `POST /messages/conversations`
- `GET /messages/conversations/:id`
- `GET /messages/conversations/:id/messages`
- `POST /messages/conversations/:id/messages`
- `PATCH /messages/conversations/:id/read`
- `GET /puzzles/next`
- `GET /puzzles/daily`
- `GET /puzzles/limits/me`
- `GET /puzzles/stats/me`
- `GET /puzzles/history/me`
- `POST /puzzles/:id/hint`
- `POST /puzzles/:id/submit`
- `GET /settings/me`
- `PATCH /settings/me`

All paths above are relative to `EXPO_PUBLIC_API_URL`, which already includes `/api`.

## Socket.IO Contract

Authentication:

- Connect to `EXPO_PUBLIC_SOCKET_URL`
- Send `auth: { accessToken }`

Client emits:

- `joinQueue` with `{ mode, playerName, timeControlIndex?, ratingRange? }`
- `leaveQueue`
- `createRoom` with `{ playerName }`
- `joinRoom` with `{ roomId, playerName }`
- `rejoinRoom` with `{ roomId }`
- `spectateRoom` with `{ roomId }`
- `makeMove` with `{ fromRow, fromCol, toRow, toCol, promotion? }`
- `drawOffer`
- `drawDeclined`
- `drawAccepted`
- `resign`
- `leaveRoom`
- `sendMessage` with `{ text }`
- `getRooms`

Server emits:

- `queueJoined`
- `queueUpdate`
- `queueLeft`
- `matchFound`
- `roomCreated`
- `joinedRoom`
- `rejoinedRoom`
- `playerJoined`
- `moveMade`
- `drawOffer`
- `drawDeclined`
- `drawAccepted`
- `playerResigned`
- `chatMessage`
- `roomsList`
- `spectatedRoom`
- `spectatorCount`
- `roomClosed`
- `serverError`

## Game Modes Identified

- AI chess
- Local same-device chess
- Online room code multiplayer
- Online matchmaking: `casual`, `ranked`, `blitz`, `rapid`, `beginner`, `intermediate`, `advanced`
- LAN/Wi-Fi play in web UI
- Puzzle/training

## Database-Backed Features

- Users, auth sessions, profile metadata, settings
- Games and move history
- Ratings, win/loss/draw stats
- Friend relationships
- Conversations and messages
- Puzzles, puzzle attempts, daily puzzle usage
- Community posts
- Billing/subscriptions/referrals/support payments
- Tournaments
- Analysis notes/reports and mistakes
- Feedback, waitlist, automation/admin records

## Missing APIs Needed For Production Mobile

- Mobile refresh-token strategy that does not rely on HttpOnly browser cookies. Current mobile persists short-lived access/socket token only.
- Push notification device token registration and notification feed endpoints.
- Mobile password reset deep-link contract.
- AI move endpoint or documented mobile Stockfish worker package strategy.
- Timed-game server reconciliation events. The UI has timer placeholders; backend room state does not expose authoritative clock ticks.
- Rematch socket event. Draw and resign exist; rematch is not implemented in the inspected socket handlers.
- Draw offer state acknowledgement beyond peer event. Mobile can emit and receive draw events, but no persisted offer state exists.
- Friend request UX endpoints are present under `/auth/friends/*`, but a cleaner `/social/friends` mobile contract would reduce coupling.
- Room list pagination/filtering. `getRooms` socket event returns an in-memory list only.

See [backend-mobile-gaps.md](backend-mobile-gaps.md) for the production backend change list.

## Reuse vs Redesign

Reusable:

- REST endpoint contracts
- Socket.IO event names and payloads
- Auth response shape
- Game persistence model
- Puzzle API and UCI move flow
- Leaderboard/history/profile/settings data

Redesigned for mobile:

- Navigation and app shell
- Chessboard touch interaction
- Auth persistence with SecureStore
- Loading/error/empty states
- Native safe-area layout
- State management with Zustand instead of Redux/localStorage
- Mobile-first game controls and social hub

# Multiplayer UX Parity

## Web UX Audited

- `frontend/src/features/chess/components/MultiplayerChess.jsx`
- `frontend/src/features/chess/components/MultiplayerGameScreen.jsx`
- `frontend/src/features/chess/hooks/useMultiplayerChess.js`
- `frontend/src/features/chess/components/ChatBox.jsx`
- `frontend/src/features/chess/utils/gamePresentation.js`
- Backend socket handlers for room, queue, draw, resign, spectator, chat, and timer events.

## Implemented In Mobile

- Play Online now shows the logged-in ChessPlay username instead of a hardcoded player name.
- Matchmaking modes match the web surface: casual, ranked, blitz, rapid, beginner, intermediate, and advanced.
- Time control selector uses backend-supported time control indexes, including no-clock casual games.
- Queue UX includes searching state, queue size, elapsed time, and cancel search.
- Private room creation leads to a waiting-for-opponent live room state with shareable room code.
- Room code input validates and normalizes six-character alphanumeric codes.
- Room browser supports refresh, player names, game status, spectator count, join, spectate, and native share.
- Live game header shows white/black names, available rating, current turn, connection state, spectator count, and room sharing.
- Spectator mode is clearly labeled as view-only and provides a back-to-room-browser exit.
- Multiplayer controls include draw offer, draw accept/decline, resign confirmation, and leave confirmation.
- Room chat is scrollable, shows message ownership, enforces the backend 200-character limit, and surfaces chat/rate-limit server errors.
- Result screen now displays checkmate, draw, resignation, timeout, abandonment, winner color/player when available, and a clean back-to-play path.

## Backend Events Covered

- `joinQueue`, `leaveQueue`, `queueJoined`, `queueUpdate`, `queueLeft`
- `createRoom`, `roomCreated`
- `joinRoom`, `joinedRoom`
- `spectateRoom`, `spectatedRoom`, `spectatorCount`
- `rejoinRoom`, `rejoinedRoom`
- `moveMade`
- `drawOffer`, `drawAccepted`, `drawDeclined`
- `resign`, `playerResigned`
- `playerDisconnected`, `playerRejoined`, `playerLeft`, `playerAbandoned`
- `leftRoom`, `roomClosed`
- `sendMessage`, `chatMessage`, `serverError`
- `clockSnapshot`, `clockTick`, `timeoutResult`

## Manual Tests

1. Sign in and open Play. Confirm Play Online shows the logged-in username.
2. Select each matchmaking mode and confirm the selected state updates.
3. Start matchmaking, confirm queue status and elapsed seconds update, then cancel search.
4. Create a room and confirm the live screen shows waiting-for-opponent plus share room code.
5. Enter invalid room codes and confirm the Join button/validation prevents bad joins.
6. Refresh room browser and confirm rooms show players, status, spectators, join, watch, and share actions.
7. Join a two-device room and confirm white/black names, turn state, connection state, and spectator count display.
8. Offer a draw, accept on the other device, and confirm both clients reach the result flow.
9. Offer a draw, decline on the other device, and confirm the sender can offer again.
10. Resign and confirm the destructive confirmation appears before emitting `resign`.
11. Leave a live room and confirm the leave confirmation appears before cleanup.
12. Spectate a full room and confirm the board is view-only, chat is visible, and Back to room browser leaves the spectator room.
13. Send a room chat message over 200 characters and confirm the mobile length warning blocks send.
14. Trigger backend chat rate limiting and confirm `serverError` is visible in chat/live notices.
15. Finish games by checkmate, draw, resignation, timeout, and abandonment; confirm the result screen names status and winner when backend supplies enough data.

## Remaining Multiplayer Differences

- Native copy-to-clipboard is not installed; room-code sharing uses the platform share sheet.
- Ratings are shown only when already available in mobile state. The current backend room player payload does not consistently include opponent ratings.
- Rematch remains backend-gap territory and is not faked in mobile.
- Chat moderation/rate-limit copy is limited to backend `serverError.message`.
- Matchmaking mode/ratingRange payloads are sent to the existing backend, but true ranked/rating-band pairing still depends on backend behavior.

# Mobile Reconnect and Rejoin

## Backend Behavior

- Socket.IO authenticates with an access JWT in `handshake.auth.accessToken`.
- `rejoinRoom` accepts `{ roomId }`, finds the authenticated user by `userId` inside the room's `players.w.userId` or `players.b.userId`, replaces the stale socket id, joins the socket room, emits `rejoinedRoom` to the player, and emits `playerRejoined` to the room.
- Disconnect grace is handled by the backend. During grace it emits `playerDisconnected` with `{ color, name, reconnectBy, gameState }`.
- If the player does not return before grace expires, the backend emits `playerAbandoned` with `{ color, winnerColor, gameState }`.
- Room closure and leave flows can emit `leftRoom`, `playerLeft`, and `roomClosed`.
- Mobile recovery uses `GET /api/games/active-room`, which returns the active room for the authenticated user by scanning in-memory socket rooms by `userId`.
- Full room lifecycle parity is documented in `docs/multiplayer-lifecycle.md`.

Known backend limitation: active-room lookup is process-memory based. It supports socket-id loss from mobile backgrounding, but it does not recover games after backend process restart or cross-process room sharding.

## Mobile Behavior

- Stores `activeRoomId`, `activeColor`, `lastKnownGameState`, and `lastConnectedAt` in SecureStore after server-confirmed room events.
- On app launch after session restore, calls `GET /api/games/active-room`.
- On app foreground, calls the same endpoint and emits `rejoinRoom` if the backend confirms an active room.
- On manual Play-screen rejoin, checks the backend first and only emits `rejoinRoom` for a server-confirmed active room.
- On socket token expiry, refreshes mobile auth tokens and recreates the socket with the fresh token.
- Clears active-room storage on logout, explicit leave, room closed, invalid rejoin, and terminal abandonment/resign result flows.
- Room browsing uses `getRooms` / `roomsList`; spectating uses `spectateRoom` / `spectatedRoom`.

## Socket Events Handled

- `rejoinedRoom`
- `playerDisconnected`
- `playerRejoined`
- `playerLeft`
- `playerAbandoned`
- `leftRoom`
- `roomClosed`
- `spectatorCount`
- `roomsList`
- `serverError`

## Manual Test Steps

1. Sign in on two mobile devices or simulators.
2. Device A creates a room.
3. Device B joins the room.
4. Make one legal move from each side and confirm both boards update.
5. Background Device B or disable its network.
6. Confirm Device A shows "Opponent disconnected".
7. Bring Device B foreground within the grace window.
8. Confirm Device B restores the active room and emits `rejoinRoom`.
9. Confirm Device A shows "Opponent rejoined".
10. Repeat, but keep Device B offline past the grace window.
11. Confirm Device A receives a win by abandonment and Device B cannot fake a successful rejoin.
12. Kill and relaunch the mobile app during an active room.
13. Confirm launch restore calls active-room recovery and rejoins the server-confirmed room.
14. Log out during or after a game.
15. Confirm active-room storage is cleared and no rejoin button appears.

## Known Limitations

- Backend active-room recovery is in-memory only.
- Room discovery is still not paginated.
- Reconnect countdown is display-only; authoritative timing remains backend-owned.
- Push notifications for opponent disconnect/rejoin are not implemented.

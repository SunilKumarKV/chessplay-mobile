# Multiplayer Lifecycle

## Backend Socket Event Audit

The mobile app follows the current ChessPlay backend event names and payloads:

| Event | Direction | Payload |
| --- | --- | --- |
| `roomCreated` | server -> client | `{ roomId, gameState, chatHistory }` |
| `joinedRoom` | server -> client | `{ roomId, gameState, color, chatHistory }` |
| `rejoinedRoom` | server -> client | `{ roomId, gameState, color, chatHistory }` |
| `spectatedRoom` | server -> client | `{ roomId, gameState, chatHistory, spectatorCount }` |
| `playerJoined` | server -> room | `{ gameState, newPlayer: { color, name } }` |
| `moveMade` | server -> room | `{ gameState, move: { fromRow, fromCol, toRow, toCol } }` |
| `drawOffer` | server -> opponent | `{ fromColor, fromName }` |
| `drawAccepted` | server -> room | `{ gameState }` |
| `drawDeclined` | server -> offerer | no payload |
| `playerResigned` | server -> room | `{ color, winnerColor, gameState }` |
| `playerDisconnected` | server -> room | `{ color, name, reconnectBy, gameState }` |
| `playerRejoined` | server -> room | `{ gameState, color, name }` |
| `playerLeft` | server -> room | `{ color, name }` |
| `playerAbandoned` | server -> room | `{ color?, winnerColor, gameState }` |
| `leftRoom` | server -> client | no payload |
| `roomClosed` | server -> spectator/client | `{ roomId, message }` |
| `spectatorCount` | server -> room | `{ roomId, count }` |
| `roomsList` | server -> client | `Array<{ id, players, spectatorCount, isFull, status }>` |
| `chatMessage` | server -> room | `{ userId, username, text, timestamp }` |
| `serverError` | server -> client | `{ message }` |

Client emits:

- `createRoom` with `{ playerName }`
- `joinRoom` with `{ roomId, playerName }`
- `rejoinRoom` with `{ roomId }`
- `spectateRoom` with `{ roomId }`
- `getRooms`
- `makeMove` with backend row/column coordinates
- `drawOffer`
- `drawAccepted`
- `drawDeclined`
- `resign`
- `leaveRoom`
- `sendMessage` with `{ text }`

Note: the backend event is `drawOffer`, not `drawOffered`.

## Mobile State Machine

Mobile tracks the room lifecycle as:

- `idle`
- `creating`
- `joining`
- `connected`
- `reconnecting`
- `opponent_disconnected`
- `draw_offered`
- `game_over`
- `room_closed`

The lifecycle state is separate from raw Socket.IO connection status so the UI can show precise room-level messages while the socket reconnects under the hood.

## UX Coverage

- Creating room: Play screen shows a loading create action and transitions when `roomCreated` arrives.
- Joining room: mobile validates six-character room codes before emitting `joinRoom`; backend `serverError` handles invalid or missing rooms.
- Waiting opponent: `roomCreated` shows the created room and waiting message.
- Reconnecting: launch, foreground, and manual restore call active-room recovery before emitting `rejoinRoom`.
- Opponent disconnected: `playerDisconnected` shows the backend reconnect grace timestamp.
- Opponent rejoined: `playerRejoined` restores connected room state.
- Draw offer received: `drawOffer` shows accept/decline actions.
- Draw offer sent: mobile disables duplicate local draw offers until declined or accepted.
- Draw accepted: `drawAccepted` marks the game over and clears active-room storage.
- Draw declined: `drawDeclined` clears the pending offer state.
- Resign: `playerResigned` differentiates "You resigned" from "Opponent resigned" and clears active-room storage.
- Abandonment: `playerAbandoned` shows win/loss by abandonment and clears active-room storage.
- Room closed/left: `roomClosed` and `leftRoom` clear storage and return the user to a safe state.
- Spectator mode: room browser can emit `spectateRoom`; `spectatedRoom` opens the live board with moves disabled.
- Room browser: `getRooms` loads backend in-memory rooms and supports join/watch actions.
- Chat: `sendMessage` and `chatMessage` match backend payloads; backend rate-limit or payload errors appear through `serverError`.

## Storage Cleanup

Active-room storage is cleared on:

- logout
- explicit leave
- `leftRoom`
- `roomClosed`
- invalid rejoin errors
- `playerAbandoned`
- `playerResigned`
- `drawAccepted`
- game result screen completion

## Remaining Multiplayer Gaps

- Room discovery is still in-memory and not paginated.
- Active-room recovery is not cross-process durable.
- Spectator mode has basic viewing and chat only; no dedicated spectator list UI yet.
- Backend draw-offer state is not authoritative, so duplicate prevention is client-side only.
- Push notifications for disconnect, rejoin, and turn reminders are not implemented.

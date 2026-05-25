# Authoritative Multiplayer Timers

## Backend Clock Contract

Timed multiplayer rooms expose `gameState.clock`:

```ts
{
  enabled: boolean;
  timeControlIndex: number | null;
  whiteMs: number;
  blackMs: number;
  incrementMs: number;
  activeColor: "w" | "b";
  lastTickAt: number | null;
  status: "idle" | "running" | "paused" | "ended";
}
```

Supported timed controls match the existing web clock ordering:

- `0`: 1+0 Bullet
- `1`: 2+1 Bullet
- `2`: 3+0 Blitz
- `3`: 5+3 Blitz
- `4`: 10+0 Rapid
- `5`: 10+5 Rapid
- `6`: 30+0 Classical
- `7`: Unlimited, treated as no-clock
- `null`: casual no-clock

## Socket Events

The backend emits clock updates only for timed games:

- `clockSnapshot` with `{ roomId, clock, serverNow }`
- `clockTick` with `{ roomId, clock, serverNow }`
- `timeoutResult` with `{ roomId, color, winnerColor, gameState, clock, serverNow }`

`clockSnapshot` is emitted when rooms are created, joined, rejoined, spectated, moved, drawn, resigned, paused, resumed, or ended. `clockTick` is emitted once per second while a timed game is running.

## Timeout Behavior

- The backend deducts elapsed time from the active player.
- On a legal move, the backend deducts elapsed time, applies increment to the moving player, switches the active clock, and emits a fresh snapshot.
- If white reaches `0`, black wins.
- If black reaches `0`, white wins.
- The backend updates the game record, updates player stats, marks `gameState.status = "timeout"`, stops the clock, and emits `timeoutResult`.
- Mobile never decides the winner from local time display.

## Disconnect Behavior

The backend pauses timed clocks during the reconnection grace window. This avoids punishing mobile app backgrounding or temporary network loss while the backend waits for `rejoinRoom`. When the player rejoins and the game is still playable, the clock resumes from the authoritative backend snapshot.

If the player does not rejoin before the grace window expires, the normal abandonment flow wins the game for the opponent and the clock is stopped.

## Mobile Behavior

- Live games render the backend `gameState.clock` or the latest `clockSnapshot` / `clockTick`.
- Low time is shown when either side has 10 seconds or less.
- Timeout result UI is driven only by `timeoutResult`.
- Local practice still uses the existing placeholder timer UI until local clock parity is implemented.

## Manual Test Steps

1. Start two signed-in clients.
2. Select `1+0` on mobile Play and create a room.
3. Join from the second client and confirm both clients receive `clockSnapshot`.
4. Confirm `clockTick` arrives every second and only the active color decreases.
5. Make a legal white move and confirm white receives no negative time, increment is applied if configured, and active color switches to black.
6. Repeat for black.
7. Disconnect one client and confirm both clocks pause during reconnect grace.
8. Rejoin and confirm the clock resumes from the backend snapshot.
9. Let one player flag and confirm `timeoutResult` arrives with the correct `winnerColor`.
10. Confirm resign, draw, checkmate, stalemate, abandonment, and room close stop the clock.

## Known Limitations

- Clock timers are process-local with the current in-memory room state.
- Multi-instance deployments need shared room/clock ownership before horizontal scaling.
- Mobile displays backend ticks once per second; it does not interpolate between ticks yet.

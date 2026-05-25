# ChessPlay Mobile Gameplay Smoke Test

Use two authenticated devices or simulators for live multiplayer checks. The backend socket state is expected to provide `gameState.board` as the source of truth. Mobile can still read `gameState.fen`, `gameState.moveHistory`, or `gameState.moves` as fallbacks when older payloads are received, but it must never reset to the starting position while a backend board exists.

## Backend Board Shape

The backend board is an 8x8 array ordered from rank 8 to rank 1:

```ts
[
  ["bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR"],
  ["bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP"],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  ["wP", "wP", "wP", "wP", "wP", "wP", "wP", "wP"],
  ["wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"]
]
```

Manual `backendBoardToFen` validation:

- Initial backend board with `turn: "w"` and full castling rights should produce:
  `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1`
- Same board with `turn: "b"` should contain:
  ` b ` as the active color field.
- If `gameState.board` exists, the app must render that board and must not reset to the starting position due to missing `fen`.

## Adapter Regression Checks

1. `backendRowColToSquare(6, 4)` returns `e2`.
2. `algebraicToBackendRowCol("e4")` returns `{ row: 4, col: 4 }`.
3. `fenToBackendBoard(initialFen)` returns a board with `bR` at `[0][0]`, `bK` at `[0][4]`, `wP` at `[6][4]`, and `wK` at `[7][4]`.
4. Backend `moveHistory` entries with `from: [6, 4]` and `to: [4, 4]` display as `e2-e4`.
5. Backend `moveHistory` entries with `text` display the backend text instead of generated notation.

## Local Practice Smoke Tests

1. Open Play.
2. In Local practice, move white pawn `e2-e4`.
3. Move black pawn `e7-e5`.
4. Try moving white pawn `e4-e3`; it must be rejected by legal target selection.
5. Try diagonal pawn capture when no piece is present; it must not be highlighted or emitted.
6. Move knight `g1-f3`; it must be legal.
7. Try bishop `f1-b5` before moving the `e2` pawn; the blocked path must be rejected.
8. Set up or reach a promotion position; tapping the promotion square must open the promotion picker.

## Live Multiplayer Smoke Tests

1. Device A creates a room.
2. Device B joins the room code.
3. Device A is white and sees white pieces at the bottom.
4. Device B is black and sees black pieces at the bottom.
5. Device A moves `e2-e4`.
6. Confirm Device B sees the move and can move `e7-e5`.
7. Try selecting an opponent piece; the app must show a friendly error.
8. Try moving when it is not your turn; the app must show a friendly error.
9. Try an illegal pawn backward move; the app must not emit `makeMove`.
10. Try diagonal capture only when an opponent piece is present.
11. Move knight `g1-f3`; the backend should accept and sync the updated board.
12. Try bishop through a blocked path; the app must not emit `makeMove`.
13. If the backend allows castling from the current state, perform king-side castling and confirm the rook moves in the synced board.
14. If the backend exposes `enPassant`, create an en passant position and confirm the legal target appears only while `enPassant` is valid.
15. Reach a promotion position; the picker must appear and the selected promotion piece must be sent as `q`, `r`, `b`, or `n`.
16. Resign from one device and confirm both devices show the result state.
17. Offer a draw from one device and accept or decline it from the other device.

## Coordinate Validation

The board orientation changes only presentation:

- White orientation bottom row is rank 1.
- Black orientation bottom row is rank 8.
- Backend row/col emission always uses algebraic conversion:
  `e2 -> { row: 6, col: 4 }`, `e4 -> { row: 4, col: 4 }`, `e7 -> { row: 1, col: 4 }`, `e5 -> { row: 3, col: 4 }`.
- On a black-oriented board, tapping the visual bottom-row `e8` square must still emit backend row `0`, col `4`; tapping `e7` must emit row `1`, col `4`.

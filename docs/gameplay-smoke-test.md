# ChessPlay Mobile Gameplay Smoke Test

Use two authenticated devices or simulators for live multiplayer checks. The backend socket state is expected to provide either `gameState.fen`, `gameState.board`, or `gameState.moves`.

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

Manual `boardToFen` validation:

- Initial backend board with `turn: "w"` and full castling rights should produce:
  `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1`
- Same board with `turn: "b"` should contain:
  ` b ` as the active color field.
- If `gameState.board` exists, the app must render that board and must not reset to the starting position due to missing `fen`.

## Local Board Smoke Tests

1. Open Play.
2. In Play vs AI foundation, move white pawn `e2-e4`.
3. Move black pawn `e7-e5`.
4. Try moving white pawn `e4-e3`; it must be rejected by legal target selection.
5. Try diagonal pawn capture when no piece is present; it must not be highlighted or emitted.
6. Set up or reach a promotion position; tapping the promotion square must open the promotion picker.

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
11. Reach a promotion position; the picker must appear and the selected promotion piece must be sent.

## Coordinate Validation

The board orientation changes only presentation:

- White orientation bottom row is rank 1.
- Black orientation bottom row is rank 8.
- Backend row/col emission always uses algebraic conversion:
  `e2 -> { row: 6, col: 4 }`, `e4 -> { row: 4, col: 4 }`, `e7 -> { row: 1, col: 4 }`, `e5 -> { row: 3, col: 4 }`.


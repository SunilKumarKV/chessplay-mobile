# Chess Logic Parity

## Reference Files Inspected

- `backend/chessUtils.js`
- `backend/gameState.js`
- `frontend/src/features/chess/utils/moveGeneration.js`
- `frontend/src/features/chess/utils/moveValidation.js`
- `frontend/src/features/chess/utils/applyMove.js`
- `frontend/src/features/chess/utils/gamePresentation.js`
- `frontend/src/features/chess/components/Board.jsx`
- `frontend/src/features/chess/components/MultiplayerGameScreen.jsx`
- `frontend/src/features/chess/components/MoveListPanel.jsx`
- `frontend/src/features/chess/components/PlayerClockPlate.jsx`
- `frontend/src/features/chess/components/MaterialBalanceBar.jsx`

## Mobile Contract

Mobile live chess now treats the backend room `gameState.board` as the source of truth when present. FEN is still supported as a fallback for screens that do not receive backend board state.

Supported backend fields:

- `board`
- `turn`
- `status`
- `moveHistory`
- `capturedW`
- `capturedB`
- `enPassant`
- `castling`
- `halfmoveClock`
- `positionHistory`
- `clock`

Live moves emit only backend-compatible row/column coordinates:

```ts
{
  fromRow,
  fromCol,
  toRow,
  toCol,
  promotion
}
```

## Manual Regression Tests

1. Initial board
   - Open Local practice.
   - Confirm white pieces render at ranks 1-2 and black pieces at ranks 7-8.
   - Confirm white is to move.

2. White pawn e2-e4
   - Move white pawn from e2 to e4.
   - Confirm move is accepted and black is to move.

3. Black pawn e7-e5
   - Move black pawn from e7 to e5.
   - Confirm move is accepted and white is to move.

4. Illegal pawn backward move
   - Try moving a pawn backward.
   - Confirm the move is rejected and no move is emitted in live mode.

5. Diagonal pawn capture
   - Create a legal pawn capture position.
   - Confirm diagonal capture is highlighted and accepted only when an opponent piece is present.

6. Knight move
   - Move g1-f3 or b8-c6.
   - Confirm knight moves are highlighted through occupied paths.

7. Blocked bishop
   - Try moving c1-g5 before clearing d2.
   - Confirm blocked path is rejected.

8. Castling king side
   - Clear f1 and g1, keep castling rights, and ensure king is not in check.
   - Move e1-g1.
   - Confirm rook moves h1-f1 and castling rights are removed.

9. Castling blocked
   - Put any piece on f1 or g1.
   - Confirm e1-g1 is not highlighted.

10. En passant
   - Set up a double pawn push next to an opposing pawn.
   - Confirm the en-passant target square is highlighted on the immediate reply.
   - Confirm the captured pawn is removed from its original square.

11. Promotion q/r/b/n
   - Advance a pawn to the last rank.
   - Confirm the promotion picker opens.
   - Test queen, rook, bishop, and knight.
   - Confirm live mode emits `promotion` as `q`, `r`, `b`, or `n`.

12. Check
   - Create a checking move.
   - Confirm status displays `Check` and only legal replies are selectable.

13. Checkmate
   - Create a checkmate position.
   - Confirm game-over UI disables moves and status displays `Checkmate`.

14. Stalemate
   - Create a stalemate position.
   - Confirm status displays `Stalemate` and moves are disabled.

15. 50-move draw if possible
   - Use a controlled/debug state with `halfmoveClock` near 100.
   - Make a non-pawn, non-capture move.
   - Confirm status becomes `draw-50move`.

16. Black orientation
   - Join live room as black.
   - Confirm black pieces are at the bottom.
   - Move selection still emits backend row/col matching the actual board square.

17. Spectator cannot move
   - Open a room through Watch.
   - Tap pieces and legal squares.
   - Confirm moves are disabled and no `makeMove` emit occurs.

## Known Remaining Differences

- Mobile board visuals are native text/SVG-style symbols rather than the full web image-piece theme system.
- Mobile local practice does not yet expose all web game setup controls.
- Mobile does not yet show PGN/SAN notation if the backend does not provide it; it prefers backend `moveHistory.text` and falls back to coordinate notation.

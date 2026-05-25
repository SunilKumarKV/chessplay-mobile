# Local Game UX Parity

## Web UX Audited

- `frontend/src/features/chess/pages/LocalChessPage.jsx`
- `frontend/src/features/chess/components/GameScreen.jsx`
- `frontend/src/features/chess/components/MoveHistory.jsx`
- `frontend/src/features/chess/components/CapturedPieces.jsx`
- `frontend/src/features/chess/components/MaterialBalanceBar.jsx`
- `frontend/src/features/chess/components/ChessClock.jsx`
- `frontend/src/features/chess/components/PlayerClockPlate.jsx`
- `frontend/src/features/chess/components/ChessSettingsModal.jsx`
- `frontend/src/features/chess/components/BoardThemeSelector.jsx`

## Implemented In Mobile

- Local Practice is clearly labeled as same-device `Play vs Player`; it no longer implies AI is available.
- Setup controls for white/black player names.
- Local time controls: no clock, 1+0, 3+0, 5+0, 10+0, and 15+10.
- Client-side local clocks with active player highlighting, increment, pause/resume, and timeout result.
- Board orientation controls: white, black, and auto current-turn orientation.
- Board themes: classic, blue, green, and dark.
- Persisted local preferences with SecureStore.
- Local controls: start new game, reset, undo, flip board, agree draw, resign current side, pause/resume.
- Local result modal for timeout, resignation, draw, checkmate, stalemate, 50-move draw, and repetition draw.
- Last move highlight, legal target highlights, selected square highlight, and checked king indicator.
- Promotion picker supports queen, rook, bishop, and knight.
- Improved captured pieces panel with material balance.
- Move history is scrollable and pairs white/black moves by move number.

## Manual Tests

1. Open Play and confirm the first local section reads `Local Practice · Play vs Player`.
2. Set player names, change board theme, close/reopen the app, and confirm preferences restore.
3. Start a no-clock game and play `e2-e4`, `e7-e5`; confirm last move highlight and paired move history.
4. Select a white pawn, confirm legal target dots, then try an illegal backward pawn move and confirm it is rejected.
5. Switch orientation to black and confirm black pieces are at the bottom while moves still map correctly.
6. Switch orientation to auto and confirm the board flips after each completed move.
7. Start a 1+0 game, confirm white clock runs first, then black clock runs after white moves.
8. Pause the clock, wait, and confirm the displayed time does not change; resume and confirm it continues.
9. Use undo after a move and confirm board, clock, move history, and result state restore.
10. Use resign and confirm the result modal names the winner.
11. Use agree draw and confirm the draw result modal.
12. Promote a pawn in a test position or long-play scenario and confirm the picker offers Q/R/B/N.
13. Let a timed game reach zero and confirm timeout result appears without using server authority.

## Remaining Differences From Web

- Web sound effects are richer. Mobile currently persists a sound toggle placeholder but does not play move/check/capture sounds.
- Web has a fuller settings modal. Mobile keeps local settings inline to avoid adding another modal layer on the Play screen.
- Web may save finished local results through its existing product flow. Mobile does not persist completed local games yet.
- Mobile local clocks are intentionally client-only and are separate from backend-authoritative multiplayer clocks.
- AI/Stockfish is still not connected; that is a separate phase.

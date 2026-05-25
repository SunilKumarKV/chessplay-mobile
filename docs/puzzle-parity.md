# Puzzle Training Parity

## API Contract

Mobile uses the existing ChessPlay puzzle backend without adding new backend routes.

- `GET /api/puzzles/next?difficulty=beginner|intermediate|advanced|master&theme=&fresh=1`
- `GET /api/puzzles/daily?difficulty=...`
- `GET /api/puzzles/limits/me`
- `GET /api/puzzles/stats/me`
- `GET /api/puzzles/history/me`
- `POST /api/puzzles/:id/hint` with `{ "moveIndex": 1 }`
- `POST /api/puzzles/:id/submit` with `{ "move": "e2e4", "moveIndex": 1 }`

Puzzle move payloads use UCI format: `from + to + optional promotion`, for example `e7e8q`.

## Mobile UX Flow

1. The puzzle screen loads stats, limits, and recent history.
2. The user chooses difficulty and, when allowed by backend limits, a theme filter.
3. The user loads either the daily puzzle or a fresh next puzzle.
4. The board renders the backend-provided puzzle FEN.
5. The user selects and moves a piece; mobile submits the UCI move and current `moveIndex`.
6. The backend validates the move, returns the next FEN, updated `moveIndex`, and optional opponent continuation.
7. Mobile updates the board from backend FEN and continues until `completed`.
8. Hints call the backend hint endpoint and display piece/target/full-move hints according to backend limits.
9. Solved puzzles show the backend learning explanation and refresh stats/history.
10. Limit and premium responses are shown as backend-supplied upgrade messaging without faking billing.

## Implemented

- Puzzle dashboard with solved count, accuracy, rating, highest rating, daily limit remaining, and plan.
- Daily puzzle and next puzzle loading.
- Difficulty selector for beginner, intermediate, advanced, and master.
- Theme selector wired to backend query params.
- Interactive puzzle board using backend FEN.
- UCI move submission with promotion support.
- Multi-move puzzle continuation through backend `moveIndex` and returned FEN.
- Correct/wrong feedback.
- Hint support with backend hint limits.
- Puzzle solved modal with learning explanation.
- Puzzle history list.
- Loading, error, empty, limit, and premium-required states.

## Manual Tests

1. Open Training from Home and confirm stats, limits, and history load.
2. Load beginner next puzzle and confirm FEN renders.
3. Make an illegal move and confirm mobile blocks or backend returns an error.
4. Make a wrong legal move and confirm the board resets to backend FEN with wrong-move feedback.
5. Make the correct move and confirm backend FEN/opponent reply is applied.
6. Solve a multi-move puzzle and confirm `moveIndex` advances until completion.
7. Request a hint and confirm hint text and remaining hint count update.
8. Exhaust hints and confirm backend limit message appears.
9. Exhaust daily puzzles and confirm backend limit/upgrade copy appears.
10. Try advanced/master without premium and confirm backend premium-required state is shown.
11. Solve a puzzle and confirm stats/history refresh.
12. Test promotion puzzle, if available, and confirm UCI includes promotion piece.

## Remaining Differences

- Mobile does not yet animate wrong-move board shake.
- Mobile theme filtering is sent to the backend, but non-premium users may receive backend premium/limit responses.
- Mobile does not show full Lichess source/game URL details beyond current puzzle metadata.
- Mobile uses the shared `ChessBoard` component rather than the web puzzle-specific board wrapper.

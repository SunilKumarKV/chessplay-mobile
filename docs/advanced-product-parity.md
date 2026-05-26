# Advanced Product Parity

This audit covers advanced ChessPlay product areas that exist beyond core play, puzzles, social, and billing.

## Features Implemented

- Tournament lobby at `/tournaments`
  - Lists published tournaments.
  - Opens tournament detail.
  - Shows format, status, schedule, players, rules, and backend roadmap.
  - Supports join and leave when backend permits it.
- Tournament detail at `/tournaments/[id]`
  - Participants and registration state are displayed.
  - Standings are shown as unavailable because backend does not expose pairings/scores yet.
- Analysis at `/analysis`
  - Saves position notes through backend analysis notes.
  - Loads saved notes and stored reports.
  - Shows report summary when a report exists.
  - Lists mistakes review items and marks them reviewed/dismissed.
  - Calls coach session endpoint and displays the backend coming-soon response.
- Openings explorer at `/openings`
  - Searches ECO, name, moves, and tags.
  - Displays source as database or static ECO sample.
- Notifications center at `/notifications`
  - Provides an honest empty state because backend has no user notification inbox yet.
  - Links to notification settings and support.
- Feedback/support at `/support`
  - Submits feedback to `/api/feedback`.
  - Creates signed-in support tickets through `/api/automation/support-ticket`.
  - Joins waitlist through `/api/waitlist`.
- Profile achievements preview
  - Shows earned/selected badges from profile data.
  - Documents that XP, streaks, and achievements are not backed by a dedicated API.

## Backend APIs Used

- `GET /api/tournaments`
- `GET /api/tournaments/:id`
- `POST /api/tournaments/:id/join`
- `POST /api/tournaments/:id/leave`
- `GET /api/analysis/notes/:gameId`
- `POST /api/analysis/notes`
- `GET /api/analysis/reports/:gameId`
- `GET /api/mistakes?status=...`
- `PATCH /api/mistakes/:id`
- `POST /api/coach/session`
- `GET /api/openings/search`
- `POST /api/feedback`
- `POST /api/automation/support-ticket`
- `POST /api/waitlist`

## Backend Gaps

- Tournaments
  - No standings endpoint.
  - No pairings endpoint.
  - No schedule/round endpoint.
  - No match result submission endpoint for tournament games.
  - Tournament rooms are listed as backend roadmap.
- Analysis
  - No live engine analysis endpoint for move-by-move review.
  - No eval history endpoint.
  - No best-move generation endpoint for saved games.
  - Stored reports exist, but backend says premium engine reports are coming soon when absent.
- Openings
  - Search exists, but no opening detail endpoint or move tree endpoint.
  - Fallback is a static ECO sample when database rows are missing.
- Coach
  - Endpoint exists but returns `premium_coach_coming_soon`.
  - Requires `advancedAnalysis` entitlement and has no server engine coach enabled.
- Notifications
  - Settings exist, and admin automation events exist.
  - No user-facing notifications list, mark-read endpoint, unread count endpoint, or deep-link payload contract.
- Achievements/streaks
  - Profile/settings expose badges.
  - No XP, streak, level, achievement list, or claim endpoint.
- Daily challenges
  - No dedicated daily challenge endpoint beyond daily puzzles.
- Lessons
  - No lessons/openings course API found.

## Manual Test Checklist

1. Open Tournaments and confirm published tournaments load.
2. Open a tournament detail screen and confirm participants, rules, and roadmap display.
3. Join an open tournament with a signed-in account.
4. Leave a joined upcoming/open tournament.
5. Open Analysis, save a note for `manual`, and reload it.
6. Enter an invalid FEN and confirm backend validation appears.
7. Load an analysis report for a non-object id and confirm coming-soon messaging.
8. Change mistakes status filters and mark an item reviewed/dismissed if test data exists.
9. Search Openings by `sicilian`, `C20`, and blank query.
10. Open Notifications and confirm it does not pretend an inbox exists.
11. Submit feedback with a valid message.
12. Submit a support ticket while signed in.
13. Join the waitlist with a test email.
14. Confirm Profile shows badges and no fake XP/streak counters.

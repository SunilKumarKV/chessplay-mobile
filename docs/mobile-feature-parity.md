# Mobile Feature Parity Audit

Audit date: 2026-05-25

Reference repo inspected: `../chessPlay`

Mobile repo inspected: `../chessplay-mobile`

Scope: product parity only. No source code changes, refactors, or placeholder implementations were made.

## 1. Existing ChessPlay Full Feature Inventory

### Core Chess Gameplay

| Feature | Evidence | Status |
|---|---|---|
| Custom backend-compatible board state | `backend/gameState.js`, `backend/chessUtils.js` use `wP`, `bK`, row/col board state, castling, en passant, halfmove, repetition | Production-ready core |
| Local chess | `frontend/src/features/chess/pages/LocalChessPage.jsx`, `useChessGame.js` | Production-ready |
| Move generation/validation | `frontend/src/features/chess/utils/moveValidation.js`, `backend/chessUtils.js` | Production-ready core |
| Promotion modal | `frontend/src/features/chess/components/PromotionModal.jsx`, `Board.jsx` | Production-ready |
| Legal move highlights | `Board.jsx`, `MultiplayerGameScreen.jsx`, `moveGeneration.js` | Production-ready |
| Check/checkmate/stalemate/draw UI | `gamePresentation.js`, `MatchResultModal.jsx`, `useChessGame.js` | Production-ready |
| Captured pieces/material balance | `CapturedPieces.jsx`, `MaterialBalanceBar.jsx` | Production-ready |
| Move list/history | `MoveHistory.jsx`, `MoveListPanel.jsx`, `GameReplay.jsx` | Production-ready |
| PGN export/download | `pgn.js`, `useChessGame.js` | Production-ready web-only |
| Opening detection | `openings.js`, `constants/openings.json`, `useChessGame.js` | Production-ready/partial depending data quality |
| Board themes/settings | `boardThemes.js`, `BoardThemeSelector.jsx`, `ChessSettingsModal.jsx` | Production-ready |
| Sound effects | `useSoundEffects.js`, `soundManager.js` | Production-ready |
| Time controls/clocks | `useChessClock.js`, `ChessClock.jsx`, `PlayerClockPlate.jsx` | Production-ready locally; partial online authority |
| Game record persistence | `POST /api/games/record`, `Game.js`, `useChessGame.js` | Production-ready for local/AI records |

### AI Gameplay

| Feature | Evidence | Status |
|---|---|---|
| Stockfish worker integration | `useStockfish.js`, `stockfish/stockfish.js`, worker fallback candidates | Production-ready web implementation |
| AI levels | `constants/aiLevels.js` easy/medium/hard/pro with depth/skill/movetime | Production-ready |
| Legal fallback AI | `findFallbackAiMove` in `useChessGame.js` | Production-ready fallback |
| AI thinking/evaluation | `AIThinkingIndicator.jsx`, `EvaluationBar.jsx`, `useStockfish.js` | Production-ready |
| AI game persistence | `useChessGame.js` posts `/api/games/record` | Production-ready |
| Premium AI/analysis positioning | billing/plan pages mention advanced/premium surfaces | Partial/product-dependent |

### Multiplayer, Rooms, Matchmaking

| Feature | Evidence | Status |
|---|---|---|
| Socket.IO authenticated play | `backend/src/socket.ts`, `socketHandlers.ts`, `server.js` | Production-ready foundation |
| Create room | `createRoom`, emits `roomCreated` | Production-ready |
| Join room | `joinRoom`, emits `joinedRoom` and `playerJoined` | Production-ready |
| Rejoin room | `rejoinRoom`, emits `rejoinedRoom`, `playerRejoined` | Production-ready |
| Spectator mode | `spectateRoom`, `spectatedRoom`, `spectatorCount`, `roomClosed` | Production-ready/partial UI |
| Matchmaking queue | `joinQueue`, `leaveQueue`, `matchFound`, `queueUpdate` | Production-ready foundation |
| Room discovery | `getRooms`, `roomsList` | Partial; in-memory, not paginated |
| Draw offer/accept/decline | `drawOffer`, `drawAccepted`, `drawDeclined` | Production-ready basic |
| Resign | `resign`, emits `playerResigned` | Production-ready |
| Abandon/disconnect handling | `socketDisconnect.ts`, `playerDisconnected`, `playerAbandoned`, `playerLeft` | Production-ready/needs UX |
| Live room chat | `sendMessage`, `chatMessage`, `chatHistory` | Production-ready basic |
| Server-side move validation | `socketGameplay.ts`, `chessUtils.js` | Production-ready |
| Online authoritative clocks | no full clock tick/state contract in socket room state | Missing/partial |
| Rematch events | no rematch socket contract found | Missing |

### LAN/WiFi/Local Play

| Feature | Evidence | Status |
|---|---|---|
| Same-device local play | `LocalChessPage.jsx` | Production-ready |
| Same WiFi page | `LanPlayPage.jsx` | Experimental |
| Direct LAN discovery | `LanPlayPage.jsx` explicitly says coming soon | Missing |
| Bluetooth/offline nearby play | roadmap only | Missing |

### Auth and Account

| Feature | Evidence | Status |
|---|---|---|
| Email/password register | `POST /api/auth/register` | Production-ready |
| Email/password login | `POST /api/auth/login` | Production-ready |
| Google auth | `POST /api/auth/google`, web auth component | Production-ready web |
| Session restore | `GET /api/auth/session`, `apiClient` refresh flow | Production-ready web |
| Refresh token/cookie auth | `POST /api/auth/refresh`, HttpOnly cookie-oriented | Production-ready web, not mobile-native |
| Socket token | `GET /api/auth/socket-token` | Production-ready web |
| Logout | `POST /api/auth/logout` | Production-ready |
| Email verification | resend and verify routes, pages | Production-ready |
| Forgot/reset password | `forgot-password`, `reset-password` routes/pages | Production-ready web |
| Account deletion | `DELETE /api/auth/account`, delete-account legal page | Production-ready |
| Password change | `PUT /api/auth/password` | Production-ready |
| Guest mode | `guestAccess.js`, App guest flow | Production-ready web |

### Profile and Settings

| Feature | Evidence | Status |
|---|---|---|
| Own profile | `GET /api/profile/me`, `ProfilePage.jsx` | Production-ready |
| Public profile by username | `GET /api/profile/:username` | Production-ready |
| Profile update | `PATCH /api/profile/me`, `PUT /api/auth/profile` legacy | Production-ready |
| Avatar upload/delete | `POST /api/auth/avatar`, `DELETE /api/auth/avatar`, `AvatarUploader.jsx` | Production-ready web |
| User settings | `GET/PATCH /api/settings/me`, `SettingsPage.jsx` | Production-ready |
| Theme/language/sounds/gameplay settings | settings slices and UI | Production-ready/partial persistence |

### Social, Friends, Chat, Community

| Feature | Evidence | Status |
|---|---|---|
| Friends list | `GET /api/auth/friends` | Production-ready |
| User search | `GET /api/auth/users/search`, `GET /api/messages/users/search` | Production-ready |
| Friend request/respond | `POST /api/auth/friends/request`, `/respond` | Production-ready |
| Private conversations | `/api/messages/conversations` | Production-ready |
| Conversation messages | `/api/messages/conversations/:id/messages` | Production-ready |
| Mark read/unread count | `/api/messages/conversations/:id/read` | Production-ready |
| Message polling | `MessagesPage.jsx` polls every 8s | Production-ready web basic |
| Social socket typing/message | `socialTyping`, `socialMessage`, `joinConversation` implied in server | Partial; not fully wired in mobile |
| User online status | `socialUserStatus` | Partial UI |
| Community posts | `/api/social/community/posts` | Production-ready basic |
| Likes/comments/moderation | social routes | Production-ready basic |

### Puzzles and Training

| Feature | Evidence | Status |
|---|---|---|
| Puzzle list/next/daily | `/api/puzzles/next`, `/daily`, `/` | Production-ready |
| Puzzle solving flow | `PuzzlesPage.jsx`, `PuzzleBoard.jsx`, `PuzzleControls.jsx` | Production-ready |
| Multi-move validation | `/api/puzzles/:id/submit`, moveIndex flow | Production-ready |
| Hints | `/api/puzzles/:id/hint` | Production-ready |
| Stats/history/limits | `/stats/me`, `/history/me`, `/limits/me` | Production-ready |
| Premium puzzle limits | `PuzzleLimitModal`, billing integration | Production-ready |
| Lichess import/seed scripts | `scripts/importLichessPuzzles.js`, sample data | Production-ready ops tooling |

### Analysis, Mistakes, Openings, Coaching

| Feature | Evidence | Status |
|---|---|---|
| Analysis page | `AnalysisPage.jsx` | Partial/product page present |
| Analysis notes/reports | `/api/analysis/notes`, `/reports` | Partial |
| Mistake review | `/api/mistakes` | Partial |
| Opening search/explorer | `/api/openings/search`, `OpeningExplorerPage.jsx` | Partial |
| Coach session | `/api/coach/session` gated by entitlement | Experimental/partial |

### Leaderboard and History

| Feature | Evidence | Status |
|---|---|---|
| Game history | `GET /api/games/history`, `GameHistoryPage.jsx` | Production-ready |
| Game detail | `GET /api/games/:gameId` | Production-ready |
| Leaderboard | `GET /api/games/leaderboard`, `LeaderboardPage.jsx` | Production-ready |
| Ratings/stats | `User.js`, `Game.js`, Elo utils | Production-ready |

### Billing, Premium, Referrals

| Feature | Evidence | Status |
|---|---|---|
| Plans/pricing | `/api/billing/plans`, `PricingPage.jsx` | Production-ready |
| Billing status | `/api/billing/me`, `BillingPage.jsx` | Production-ready |
| UPI/manual supporter requests | `/api/billing/upi-request`, admin approval | Production-ready |
| Razorpay/payment routes | `/api/payments/*`, `razorpayService.js` | Production-ready/depends provider config |
| Payment webhooks | `/api/payments/webhook`, `/api/billing/webhooks/:provider` | Production-ready backend |
| Trial/subscription actions | `/api/payments/trial/start`, cancel, downgrade | Partial/provider-dependent |
| Referrals | `/api/referrals/me`, `/claim`, `/api/billing/referral/*` | Production-ready |
| Premium feature gates | `PremiumFeatureGate.jsx`, entitlements middleware | Production-ready |
| Ads/no-ads entitlement | `AdSlot.jsx`, billing status | Partial/product-dependent |

### Tournaments

| Feature | Evidence | Status |
|---|---|---|
| Tournament list/filter/details | `/api/tournaments`, `TournamentsPage.jsx` | Partial |
| Join/leave tournament | `/api/tournaments/:id/join`, `/leave` | Partial |
| Admin create tournament | `POST /api/tournaments`, admin routes | Partial |
| Pairings/live tournament rooms/results | Tournaments page says later phase | Missing |

### Admin, Support, Automation, Legal, Marketing

| Feature | Evidence | Status |
|---|---|---|
| Admin dashboard | `/api/admin/*`, `AdminPanelPage.jsx` | Production-ready admin |
| Support tickets/automation | `/api/automation/*`, `AutomationPage.jsx` | Partial/production admin utility |
| Feedback | `/api/feedback`, `FeedbackButton.jsx` | Production-ready |
| Waitlist | `/api/waitlist`, waitlist form | Production-ready |
| Blog | `/api/blog`, blog routes | Partial |
| Legal pages | privacy, terms, refund, cookie, contact, delete account | Production-ready web |
| SEO landing pages | chess puzzles, online chess, AI, analysis | Production-ready marketing |
| Growth pages | coaching, store, services, openings | Partial/marketing |

## 2. Current Mobile App Feature Inventory

| Category | Mobile implementation | Status |
|---|---|---|
| Expo app shell | Expo Router tabs, guarded auth/onboarding, safe-area screen components | Partial production-ready |
| Store release setup | `app.config.ts`, `eas.json`, assets, Play Store/iOS release docs | Partial production-ready |
| Auth | Login, register, forgot password request, session restore, logout, SecureStore token persistence | Partial; token model not mobile-complete |
| Dashboard | Basic greeting/cards | Partial |
| Local practice | chess.js board, legal moves, promotion picker, move history | Partial; not real Stockfish AI |
| Online play | join queue, create room, join room, live board, move emit, draw, resign, room chat | Partial |
| Chess state adapter | backend board/FEN adapter exists | Partial; still uses chess.js local prevalidation |
| Result screen | Basic status result/back-to-play | Partial |
| Profile | Own profile fetch, recent games, edit profile | Partial |
| Settings | fetch/update settings, theme toggle, logout | Partial |
| History | list `/games/history` | Partial |
| Leaderboard | list `/games/leaderboard` | Partial |
| Friends/social | friends list, requests, user search, friend request, message open | Partial |
| Messages | conversations, conversation detail, send, mark read | Partial |
| Puzzles | fetch one beginner puzzle and submit one FEN/move string manually | Minimal/partial |
| Offline/network UI | banners/loading/error/empty state components | Partial |
| Release/privacy docs | release guides, privacy/store listing drafts | Partial |

## 3. Exact Feature Gap Analysis

| Feature | Existing Repo | Mobile Repo | Status |
|---|---|---|---|
| Play vs AI | Full Stockfish worker, AI levels, evaluation, fallback AI, persistence | Renamed Local practice; no AI | Missing |
| Local same-device chess | Full custom board, clocks, themes, sounds, PGN, result modal | Basic chess.js board | Partial |
| Custom chess rules parity | Backend and web share custom board logic | Adapter exists, but board interactions still use chess.js for prevalidation | Partial risk |
| Move generation highlights | Custom moveGeneration/moveValidation including backend state | chess.js legal targets from FEN | Partial |
| Captured pieces/material | Full UI | Missing | Missing |
| Game clocks | Full local clock; online not fully authoritative | Static `TimerBar` placeholder | Missing |
| Time controls | Web offers selected time controls | Mobile queue sends only `mode: casual`; no time control UI | Missing |
| Opening detection | Web detects opening from SAN | Missing | Missing |
| PGN/export/replay | Web supports replay/export | Missing | Missing |
| Board themes | Web supports board themes | Mobile has fixed theme colors | Missing |
| Sounds | Web sound themes/effects | Missing | Missing |
| Create room | Full | Implemented | Partial; UX thin |
| Join room | Full | Implemented | Partial; UX thin |
| Rejoin room | Full socket support and web use | Listener exists, no mobile rejoin flow/emitter | Missing |
| Spectator mode | Full socket support | No screen or emitter | Missing |
| Room discovery | `getRooms`/`roomsList` | No UI/listener | Missing |
| Matchmaking | Multiple modes/options | Single Find match casual | Partial |
| Queue leave/cancel | Full | No explicit cancel | Missing |
| Disconnect/abandon UX | Full events | Most events not handled in mobile | Partial/broken |
| Draw offer | Full | Basic emit/accept/decline | Partial |
| Resign | Full | Basic emit | Partial |
| Rematch | Missing in backend | Missing | Missing backend |
| Room chat | Full basic live chat | Basic live chat implemented | Partial; no moderation/limits UX |
| Private messages | Full conversation UI with polling/search | Basic list/detail/send | Partial |
| Social socket messages/typing | Partial in backend/web | Not wired | Missing |
| Friends | Full list/request/respond | Basic list/request/respond | Partial |
| Community posts | Full post/list/like/comment UI | Missing | Missing |
| Profile public pages | Full `/profile/:username` | Missing | Missing |
| Avatar upload/delete | Full web | Missing | Missing |
| Settings | Full settings page | Basic subset | Partial |
| Email verification | Full | Missing | Missing |
| Reset password deep link | Full web | Request only | Missing |
| Account deletion | Full | Missing | Missing |
| Password change | Full | Missing | Missing |
| Guest mode | Full web guest play | Missing | Missing |
| Puzzles | Full multi-move tactical trainer with stats, hints, limits | Minimal one-puzzle FEN text submit | Broken/mostly missing |
| Puzzle stats/history/limits | Full | Not shown | Missing |
| Puzzle hints | Full | Missing | Missing |
| Puzzle board | Full interactive puzzle board | Missing; text FEN input style only | Missing |
| Analysis notes/reports | Partial web | Missing | Missing |
| Mistake review | Partial backend | Missing | Missing |
| Opening explorer | Partial web/backend | Missing | Missing |
| Coach | Experimental backend | Missing | Missing |
| Game history | Full list/detail | Basic list only | Partial |
| Game detail | Backend exists | Missing | Missing |
| Leaderboard | Full | Basic list | Partial |
| Billing/pricing | Full | Missing | Missing |
| Premium entitlements | Full backend/web gates | Missing | Missing |
| Referral | Full | Missing | Missing |
| Tournaments | Registration phase | Missing | Missing |
| LAN/WiFi page | Experimental web guidance | Missing | Missing |
| Admin | Full admin web | Missing; likely not required for mobile consumer app | Intentionally omitted |
| Feedback/support | Full | Missing | Missing |
| Push notifications | Not in backend | Missing | Missing backend/native opportunity |

## 4. Logic Compatibility Audit

| Area | Finding | Impact |
|---|---|---|
| Board state format | Backend source is `board: (wP/bK/null)[][]`, `turn`, `status`, `moveHistory`, `capturedW`, `capturedB`, `enPassant`, `castling`, `halfmoveClock`. Mobile now has an adapter and types. | Good foundation, but still needs live-device smoke testing against real backend payloads. |
| Move validation | Backend uses custom `chessUtils.js`; web uses related custom utils. Mobile uses chess.js legal moves for prevalidation. | Risk: any divergence in castling, en passant, repetition, halfmove, or future custom logic can block legal backend moves or allow UI highlights the backend rejects. |
| Move history format | Backend `moveHistory` entries use `from: [row,col]`, `to: [row,col]`, `text`, `captured`, `timestamp`; DB `moves` may use algebraic. Mobile normalizes both. | Mostly compatible. Needs UI handling for captured/promoted/status labels. |
| Socket payloads | Mobile emits `makeMove`, `createRoom`, `joinRoom`, `joinQueue`, `sendMessage`, draw/resign. | Missing `rejoinRoom`, `spectateRoom`, `getRooms`, `leaveQueue`; limited event handling for disconnect/player left/spectator count. |
| Promotion logic | Backend accepts `q/r/b/n` and uppercases internally. Mobile sends lowercase. | Compatible. Needs tests for all four promotion choices. |
| Auth token flow | Web has refresh/session cookies and socket token endpoint. Mobile stores backend `socketToken` as HTTP access token because backend currently returns access JWT in that field. | Works with current backend but unsafe/confusing long-term. Need real mobile refresh-token strategy and separate access/socket token fields. |
| API endpoint prefixes | Mobile `EXPO_PUBLIC_API_URL` includes `/api`, then uses `/auth/login` etc. | Compatible if env includes `/api`; broken if deploy env points to domain root. README/env must stay explicit. |
| Room lifecycle | Backend supports created/joined/rejoined/spectated/closed/left/abandoned/disconnected. Mobile handles only a subset. | Release blocker for reliable online play. |
| Timers | Web local clocks exist; backend room state does not expose authoritative clock ticks. Mobile timer is placeholder. | Release blocker if timed games are advertised. |
| Reconnect flow | Backend supports `rejoinRoom` by roomId/user. Mobile does not persist active roomId or emit rejoin after socket reconnect. | Online games can be lost on app background/network changes. |
| Spectator flow | Backend has spectator room map/events. Mobile has no spectator UI/listeners. | Feature missing. |
| Social messaging | Backend has REST plus socket `socialMessage` and typing events. Mobile uses REST only. | Acceptable MVP, not parity. |
| Puzzles | Backend expects UCI move submissions with moveIndex, hints/limits/stats. Mobile puzzle screen is minimal and not a real board trainer. | Major product gap. |
| AI | Web Stockfish is browser worker-based. Mobile has no native Stockfish/service strategy. | Major product gap. |

## 5. UX/Product Audit

| Journey | Existing Web Product | Current Mobile | Gap |
|---|---|---|---|
| Onboarding | Landing page, guest play, legal/marketing routes | One onboarding screen | Missing guest/marketing/deep links |
| Login/register | Email, Google, session restore, verification support | Email login/register only | Missing Google, verification, full reset/account flows |
| Start AI game | Dashboard chooses AI and time control, Stockfish runs | Local practice only | Missing AI journey |
| Start local game | Local page with clock/settings | Local practice card | Missing settings, time control, result UX |
| Create room | Multiplayer page with connection, room state, chat, spectators | Button creates room | Partial |
| Join room | Room-code UX | Text field join | Partial |
| Queue matchmaking | Modes/options/leave queue | Casual find match only | Partial |
| Spectate | Existing socket flow and web hook support | No route | Missing |
| Chat in room | Chat box with history | Basic chat panel | Partial |
| Resign/draw | Full modals/room events | Basic buttons/alerts | Partial |
| Reconnect/rejoin | Web rejoin flow | No explicit mobile rejoin | Broken for real mobile use |
| Social message | Full messages page, search, polling, unread | Basic mobile list/detail/search/send | Partial |
| Community | Full posts/likes/comments | Missing | Missing |
| Puzzles | Real board trainer with hints/stats/limits | Minimal FEN display/manual submit | Broken journey |
| Settings | Account, appearance, gameplay, logout | Basic theme/settings subset | Partial |
| Billing/premium | Pricing, status, payment request, referrals | Missing | Missing |
| Tournaments | Registration/list/details | Missing | Missing |
| Support/feedback | Feedback button/help center/contact/legal | Draft docs only | Missing |

Missing mobile screens:

- AI game setup and play
- Time-control picker
- Game detail/replay
- Spectator room
- Room browser
- Rejoin active game
- Puzzle board/trainer/stats/history/hints
- Community posts
- Public profile
- Avatar upload/delete
- Billing/pricing/payment/referral
- Tournament list/details/join/leave
- Analysis/mistakes/openings/coach
- Account deletion/password change/email verification/reset-password completion
- Help/support/feedback/contact/legal in-app screens

## 6. Mobile Native Opportunity Audit

| Feature | Existing | Mobile | Classification |
|---|---|---|---|
| Push notifications | No backend device-token system found | Missing | Native upgrade opportunity; backend required |
| Haptics | Web sounds only | Missing | Native upgrade opportunity |
| Biometric login | Missing | Missing | Native upgrade opportunity |
| Deep linking | Web URL routing | Basic scheme configured | Native upgrade opportunity for reset password, verify email, shared games |
| Share game/achievement | `/api/share/achievement` exists | Missing | Native share sheet opportunity |
| Native analytics/crash reporting | Web analytics/monitoring | Missing | Native upgrade opportunity |
| Offline storage | Web localStorage/sessionStorage | SecureStore auth only | Native upgrade opportunity |
| Background reconnect | Web tab/session assumptions | Missing | Native release requirement |
| Push turn alerts | Missing | Missing | Native upgrade opportunity; backend required |
| Bluetooth play | Roadmap only | Missing | Native upgrade opportunity |
| LAN discovery | Web says unsafe/coming soon | Missing | Native upgrade opportunity with permissions/discovery |
| Nearby play | Missing | Missing | Native upgrade opportunity |
| In-app purchases | Web/manual/Razorpay billing | Missing | Native upgrade opportunity; store policy required |
| Device image/avatar upload | Web uploader | Missing | Native upgrade opportunity |
| Handoff/share room code | Web copy room/instructions | Missing native share/copy polish | Native upgrade opportunity |

## 7. Priority Implementation Plan

### Phase 1 - Critical Broken Foundations

- Implement mobile refresh-token strategy with backend support: separate `accessToken`, `refreshToken`, `socketToken`.
- Persist active room/session metadata and implement reliable reconnect/rejoin.
- Handle all lifecycle socket events: `playerDisconnected`, `playerRejoined`, `playerLeft`, `playerAbandoned`, `leftRoom`, `roomClosed`, `serverError`.
- Replace placeholder timer UI with either hidden timers or backend-authoritative clock state.
- Add production error telemetry and structured network retry UX.

### Phase 2 - Exact Chess Parity

- Port or share backend/web custom move-generation logic for mobile prevalidation, or make backend validation authoritative while the UI highlights from backend-compatible legal moves.
- Add captured pieces, material balance, last move, check/checkmate/stalemate/draw states, and result modals.
- Add time controls, board themes, sound/haptic settings, move confirmation, PGN/replay/game detail.
- Add complete gameplay smoke automation around castling, en passant, promotion, repetition, 50-move draw, resignation, abandonment.

### Phase 3 - Multiplayer Parity

- Add room browser via `getRooms`/`roomsList`.
- Add spectator mode and spectator count.
- Add queue mode/options and cancel queue.
- Add full room lifecycle and rejoin UX.
- Add robust live chat history and message limits.

### Phase 4 - AI Parity

- Choose native Stockfish integration or backend AI move service.
- Implement AI levels matching web: easy, medium, hard, pro.
- Add AI thinking, evaluation, fallback legal move policy, game recording, and premium gates if required.

### Phase 5 - Social Parity

- Complete friends UX with pending/sent/incoming states.
- Add public profiles and avatar management.
- Improve conversations with polling/socket updates, unread state, typing, online presence.
- Add community posts, likes, comments, and moderation state display.

### Phase 6 - Premium/Product Parity

- Add pricing, billing status, supporter request flow, referrals, entitlements, no-ads/premium gates.
- Add tournaments registration/list/details.
- Add support/feedback/help/legal/account deletion screens.
- Decide mobile admin scope; likely keep admin web-only unless owner needs it.

### Phase 7 - Native Enhancements

- Push notifications for turns, messages, friend requests, tournaments.
- Biometric unlock and secure session controls.
- Deep links for password reset, verify email, room invite, profile, game replay.
- Native share sheet for room codes, games, achievements.
- Haptics, sound themes, offline puzzle cache.
- LAN/Bluetooth/nearby play discovery after architecture and privacy review.

## 8. Critical Bugs Blocking Release

1. Current mobile cannot honestly be marketed as "Play vs AI"; it has no Stockfish or AI service.
2. Online game rejoin is not implemented, so backgrounding the app or reconnecting can strand a live game.
3. Timer UI is placeholder and not backed by authoritative server state.
4. Mobile only handles a subset of room lifecycle events; disconnect, abandon, left-room, spectator, and room-list flows are incomplete.
5. Puzzle screen is not product-parity: no interactive puzzle board, hints, stats, limits, history, or full multi-move trainer UX.
6. Mobile chess prevalidation uses chess.js while backend/web logic is custom; edge-rule divergence remains a release risk.
7. Auth token naming/refresh remains a backend-mobile gap; current `socketToken` as HTTP token is compatibility-only.
8. Social screens are partial: community, public profiles, avatars, typing, online presence, and richer message state are missing.
9. Billing/premium/referrals/tournaments are absent, despite being visible product areas in the reference repo.
10. Result, game history, and replay are too thin for production chess parity.

## 9. Honest Production Verdict

NO.

The current mobile repo should not be released as the native ChessPlay product. It is a good Expo foundation and a useful backend-integration prototype, but it is still closer to a mobile MVP shell than a full native version of ChessPlay.

The strongest parts are auth basics, profile/settings basics, leaderboard/history basics, backend board-state conversion, and simple online room play. The blocking gaps are AI parity, reconnect/rejoin reliability, authoritative timers, full socket lifecycle handling, puzzle parity, social/community parity, and all premium/tournament/product surfaces.

The release path should be to first harden the foundations and exact chess/multiplayer parity, then add AI and puzzle parity. Only after those are real should the app move toward Play Store production marketing as ChessPlay mobile.

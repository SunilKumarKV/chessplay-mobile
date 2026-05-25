# Google Play Store Release Guide

## Google Play Console Setup

1. Create or use a Google Play Developer account.
2. Create a new app named `ChessPlay`.
3. Default language: choose the production target language, likely English.
4. App type: App.
5. Category: Games / Board, or the closest available chess category.
6. Pricing: Free unless monetization is enabled and reviewed.

## Required App Details

- App name: ChessPlay
- Android package: `com.devwithsunil.chessplay`
- Version: `1.0.0`
- Version code: `1`
- Contact email: add the production support email.
- Website: add the production ChessPlay website.
- Privacy policy URL: required before production rollout.

## Privacy Policy Requirement

Publish a real privacy policy URL before release. A draft is available in [privacy-policy-draft.md](privacy-policy-draft.md). Update placeholders before using it publicly.

## Data Safety Form Checklist

Review the final backend behavior before submission. Current expected disclosures:

- Account data: email, username, profile details.
- User-generated content: messages, social posts, chat, profile bio.
- Gameplay data: game history, moves, ratings, puzzle attempts.
- App activity: gameplay events and diagnostics if analytics are enabled later.
- Device identifiers: only if analytics, crash reporting, or push notifications are enabled.
- Data deletion: document the deletion request flow and backend endpoint.
- Encryption in transit: yes, production API uses HTTPS/WSS.

Push notifications and analytics are placeholders until backend/product decisions are complete.

## Screenshots Checklist

Required phone screenshots:

- 4-8 portrait screenshots.
- Use release or preview builds, not simulator-only mockups.
- Avoid fake backend data unless clearly from test accounts.
- Recommended screens: dashboard, live board, online room, chat, leaderboard, puzzles.

See `assets/screenshots/README.md` for dimensions.

## AAB Build Command

Do not run EAS production builds until `eas init` has created a real project id and credentials are configured.

```bash
npx eas init
npx eas build -p android --profile production
```

The production profile emits an Android App Bundle (`.aab`).

## Internal Testing Steps

1. Upload the AAB to Play Console internal testing.
2. Add tester email list.
3. Install from Play Store internal testing link.
4. Verify auth, session restore, online play, profile, settings, social, and puzzle flows.
5. Verify no localhost endpoints are present.
6. Verify support/privacy links.
7. Promote only after internal testing passes on at least two Android devices.

## Production Rollout Steps

1. Complete store listing.
2. Complete content rating.
3. Complete Data Safety.
4. Add privacy policy URL.
5. Resolve Play Console policy warnings.
6. Start with staged rollout, for example 5-10%.
7. Monitor crashes, login failures, socket errors, and backend rate limits.
8. Expand rollout after stability checks.


# Mobile Monetization Compliance

This mobile implementation is backend-status driven. It does not create fake premium access, does not mark payments successful on device, and does not add native in-app purchases yet.

## Backend APIs Audited

- `GET /api/billing/plans`
- `GET /api/billing/payment-methods?plan=...`
- `GET /api/billing/me`
- `GET /api/billing/monetization`
- `POST /api/billing/upi-request`
- `GET /api/referrals/me`
- `POST /api/referrals/claim`
- `GET /api/me/entitlements`
- `POST /api/payments/create-order`
- `POST /api/payments/verify`
- `GET /api/payments/history`
- `POST /api/payments/trial/start`
- `POST /api/payments/subscription/cancel`
- `POST /api/payments/subscription/downgrade`
- `POST /api/payments/coupon/validate`
- `GET /api/payments/plans`

## What Mobile Uses Now

- Current plan/status from `GET /api/billing/me`.
- Plan cards from `GET /api/billing/plans`.
- Backend payment method configuration from `GET /api/billing/payment-methods`.
- Manual UPI, bank, and PayPal proof submission through `POST /api/billing/upi-request`.
- Referral dashboard and claim flow from `/api/referrals`.
- Entitlement display from `/api/billing/monetization` and `/api/me/entitlements`.

## Store Compliance Position

Manual supporter requests can be shown before store launch only as backend-admin-verified support flows. The mobile app must not imply instant premium activation, and this implementation explicitly says admin approval is required.

Razorpay checkout is not wired into mobile. For Play Store and App Store distribution, digital premium features generally need Google Play Billing or Apple In-App Purchase unless the feature qualifies under a permitted external purchase category. ChessPlay premium features such as no ads, premium themes, puzzle limits, and analysis access are digital app benefits, so they should move to official store billing before public production monetization.

External PayPal/UPI/bank instructions may be acceptable for donations or manually verified support outside digital entitlement sales, but using them to unlock in-app digital benefits can violate store rules. Treat the current flow as staging/internal testing until legal/store review confirms the policy path.

## Required Before Real Store Monetization

- Add Google Play Billing for Android premium plans.
- Add Apple In-App Purchase for iOS premium plans.
- Add backend receipt validation for Play Billing and App Store Server API.
- Map verified store purchases to the existing backend entitlement model.
- Keep manual UPI/bank/PayPal support as web-only or donation-only unless approved by store policy.
- Update privacy policy and Data Safety/App Privacy forms for purchases and payment identifiers.

## Premium Gate Policy

The reusable mobile `PremiumGate` only reflects backend entitlements. It must not block free core chess features. It can be used for cosmetic themes, no-ads messaging, advanced puzzle filters, analysis limits, or other features already present in backend entitlement data.

## Manual Tests

1. Sign in with a free account and open Billing. Confirm plan is free and core chess is not blocked.
2. Load plans and verify amounts/benefits match `/api/billing/plans`.
3. Select each payment method and confirm inactive backend methods are disabled.
4. Submit an invalid reference and confirm backend validation error appears.
5. Submit a valid manual proof on a staging backend and confirm request status becomes pending.
6. Approve the request from backend admin tools and confirm mobile shows supporter/premium status after refresh.
7. Open Referrals, share the invite link, and confirm native share sheet opens.
8. Claim an invalid referral code and confirm backend error appears.

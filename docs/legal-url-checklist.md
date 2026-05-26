# Legal URL Checklist

## Current Status

Store submission is blocked until the final public legal URLs are live and verified.

Verification attempt on May 26, 2026 returned no HTTP response from these configured URLs:

- `https://getchessplay.vercel.app/privacy`
- `https://getchessplay.vercel.app/terms`
- `https://getchessplay.vercel.app/delete-account`
- `https://getchessplay.vercel.app/support`

## Required Production URLs

| Purpose | Required URL | Status |
| --- | --- | --- |
| Privacy Policy | `https://getchessplay.vercel.app/privacy` | Blocked until live |
| Terms of Service | `https://getchessplay.vercel.app/terms` | Blocked until live |
| Delete Account | `https://getchessplay.vercel.app/delete-account` | Blocked until live |
| Contact/Support | `https://getchessplay.vercel.app/support` | Blocked until live |

## Page Requirements

- Privacy Policy must disclose account data, gameplay data, social/messages data, device push tokens, local biometric unlock, analytics/monitoring if enabled, and deletion process.
- Terms must describe acceptable use, multiplayer conduct, account rules, premium/supporter limitations, refunds if applicable, and dispute/contact process.
- Delete Account page must explain how a signed-in or email-verified user can request deletion, expected completion timeline, retained legal/security records, and support contact.
- Contact/Support page must provide a production support email or form.

## Pre-Submission Verification

Run:

```bash
for url in \
  https://getchessplay.vercel.app/privacy \
  https://getchessplay.vercel.app/terms \
  https://getchessplay.vercel.app/delete-account \
  https://getchessplay.vercel.app/support
do
  curl -L -s -o /dev/null -w "%{http_code} %{url_effective}\n" "$url"
done
```

All URLs should return `200` or an intentional public redirect to a `200` page before Play Store or App Store submission.

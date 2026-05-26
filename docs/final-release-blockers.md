# Final Release Blockers

## Release Status

**NO-GO**

Do not start Play Store or App Store production builds until every blocker below is closed and verified.

## Blockers

| Blocker | Status | Required Resolution |
| --- | --- | --- |
| Legal URLs not live | Blocked | Publish and verify Privacy Policy, Terms, Delete Account, and Support pages. |
| Physical Android QA pending | Blocked | Complete the Android real-device checklist in `docs/physical-device-qa.md`. |
| Physical iPhone QA pending | Blocked | Complete the iPhone real-device checklist in `docs/physical-device-qa.md`. |
| EAS project ID missing | Blocked | Initialize the Expo/EAS project and confirm `extra.eas.projectId` appears in Expo config. |
| EAS credentials missing | Blocked | Configure Android and iOS signing credentials through EAS. |
| Backend push token migration not deployed | Blocked | Deploy the backend migration that creates `device_tokens` before testing production push registration. |

## Verify Legal URLs

Run these commands and confirm every response is successful, ideally `HTTP/2 200` or `HTTP/1.1 200 OK`.

```bash
curl -I https://getchessplay.com/privacy
curl -I https://getchessplay.com/terms
curl -I https://getchessplay.com/delete-account
curl -I https://getchessplay.com/support
```

## EAS Setup Commands

Run these locally before any production build.

```bash
npx eas login
npx eas init
npx eas credentials
```

## Blocked Production Build Commands

Do not run these until the release status changes to **GO**.

Android:

```bash
npx eas build -p android --profile production
```

iOS:

```bash
npx eas build -p ios --profile production
```

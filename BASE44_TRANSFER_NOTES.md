# Noteably Transfer Notes

This package contains the stabilized Noteably app code after the rescue phases.

## What Changed

- Score-based answer checking for repeated notes, chords, and both-hand groups.
- Controlled level generator for levels 1-20 and Chopin mode.
- More stable sheet rendering and Sound It Out playback.
- Consistent paid access using `Subscription.status === "active"`.
- Account-linked checkout and safer subscription confirmation.
- AI-assisted upload and recording review wording.
- Product cleanup for final Base44 import.

## Files Added

- `src/lib/answerEngine.js`
- `src/lib/levelGenerator.js`
- `src/lib/subscription.js`

## Base44 Resources Touched

- `base44/functions/create-checkout/entry.ts`
- `base44/functions/wix-payments-webhook/entry.ts`

## After Importing Into Base44

1. Confirm the `Subscription` entity still has `checkout_id`, `subscription_id`, `user_email`, and `status`.
2. Confirm these secrets are set in Base44:
   - `WIX_PAYMENTS_API_KEY`
   - `WIX_PAYMENTS_SITE_ID`
   - `WIX_PAYMENTS_WEBHOOK_PUBLIC_KEY`
3. Publish the app.
4. Test with a signed-in account:
   - Subscribe flow creates a pending subscription.
   - Wix webhook changes it to active.
   - Practice opens only for active subscribers.
   - Advanced Practice opens only for active subscribers.
   - Settings can cancel a subscription with a real `subscription_id`.

## Local Checks Passed

- `npm run lint`
- `npm run build`

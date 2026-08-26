# MyLearna email authentication rollout

## Current mode

The application defaults to `magic-link` mode. Set
`NEXT_PUBLIC_MYLEARNA_EMAIL_AUTH_MODE=magic-link` (or leave it unset) while
the hosted email templates continue to use confirmation links.

## OTP-code mode

`NEXT_PUBLIC_MYLEARNA_EMAIL_AUTH_MODE=otp-code` changes the primary login and
signup journey to stay on the MyLearna screen: request a challenge, enter the
emailed token, and establish the session directly. The callback remains
available for existing magic links.

## Coordinated rollout

1. Deploy the code with `magic-link` mode and verify the existing templates.
2. Verify the OTP build and tests.
3. Review the Supabase **Magic Link or OTP** template and use `{{ .Token }}`.
4. Review **Confirm signup** only if password signup/code confirmation needs it.
5. Set `NEXT_PUBLIC_MYLEARNA_EMAIL_AUTH_MODE=otp-code` and redeploy.
6. Run real-device login, signup, resend, recovery, and legacy-link checks.

Recommended subject: **Your MyLearna sign-in code**

Example OTP body:

```text
Your MyLearna sign-in code

Enter this code in the MyLearna screen you already opened:

{{ .Token }}

This code can only be used once and will expire.

If you did not request this, you can ignore this email.
```

Do not include `{{ .ConfirmationURL }}` in an OTP-only template. Do not state
a fixed expiry period until the hosted Auth configuration is confirmed.

Do not change Reset password/recovery, Invite, or Change email templates as
part of this rollout.

## Coordinated rollback

1. Restore the approved confirmation-link template(s).
2. Set `NEXT_PUBLIC_MYLEARNA_EMAIL_AUTH_MODE=magic-link`.
3. Redeploy and verify old and in-flight callback links.

Changing only the environment variable is not a complete rollback if hosted
templates remain code-only.

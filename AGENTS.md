<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Security model

- **Guest device binding** uses an httpOnly HMAC cookie (`hre-guest-device`) set after successful check-in code verification. Server actions validate this cookie on guest mutations (orders, sessions, panic).
- **Server Actions** enforce caller authentication: management actions require a valid staff session + page permission; guest actions require a guest device cookie.
- **Check-in codes** (6 digits) are rate-limited per room/IP. Code listing is staff-only (rooms page access).
- **Order pricing** is resolved server-side from the product catalog — client `unitPrice` values are ignored.
- **REST `/api/v1/*`** requires `HRE_API_SECRET` in production (`lib/server/api-auth.ts`); dev skips auth when the secret is unset.
- **Management `/management/*`** uses DB staff accounts with per-user page permissions. Permissions are loaded from the database on each request (not trusted from the session cookie). Route layouts enforce page access; server actions enforce the same permissions.
- **Production secrets:** set `MANAGEMENT_SESSION_SECRET` (32+ chars) and optionally `GUEST_DEVICE_SECRET`. The app fails closed in production if secrets are missing or too short.
- **Login rate limiting:** 8 attempts per 15 minutes per IP/email.
- **Guest checkout** sets room status to `just_checked_out`; staff manually moves to `cleaning`, then `available`.
- **Staff logout** is the only customer-facing path back to `/` (5 taps on the logo on `/guest/duration`).

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Guest kiosk security (demo limitations)

- **Device room binding** is stored in `localStorage` (`hre-guest-device-v1`). It is not server-enforced; tampering can change the bound room.
- **Server Actions** (`app/actions/checkin-codes.ts`, `app/actions/hotel-data.ts`) have no caller authentication. Production should add session/device tokens and rate limits.
- **Check-in codes** (6 digits) should be rate-limited per room/IP to reduce brute force (`lib/server/checkin-codes-db.ts`).
- **REST `/api/v1/*`** requires `HRE_API_SECRET` in production (`lib/server/api-auth.ts`); dev skips auth when the secret is unset.
- **Guest routes** are guarded client-side only (`components/guest-device-guard.tsx`). Optional follow-up: httpOnly cookie + middleware.
- **Staff logout** is the only customer-facing path back to `/` (5 taps on the logo on `/guest/duration`).

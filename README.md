# Hotel Rising Empire — Tablet demo

Next.js 16 (App Router) demo of a short-stay pension guest tablet + staff dashboard, installable as a PWA on iPad and Android tablets.

## Getting started

```bash
npm install
cp .env.example .env       # adjust env vars (see "Environment" below)
npm run db:migrate         # apply Prisma migrations to ./prisma/dev.db
npm run db:seed            # optional: load demo rooms / catalogue
npm run dev
```

Open <http://localhost:3000> for the guest tablet UI, or <http://localhost:3000/management> for the staff dashboard.

> **Package manager**: this repo's lockfile is `package-lock.json` — use `npm`. Running `pnpm` alongside corrupts `node_modules` because pnpm relocates conflicting packages into `node_modules/.ignored`, breaking terser during the next webpack build.

## Environment

| Variable             | Default      | Purpose                                                                                                       |
| -------------------- | ------------ | ------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`       | `file:./prisma/dev.db` | Prisma datasource. Override for Postgres in production.                                                |
| `HRE_USE_DATABASE`   | `false`      | When `true`, guest & management UIs share state via Server Actions + Prisma. Required for the cross-device iPad-PWA + staff-browser demo. The root layout is `force-dynamic`, so flipping this takes effect on next request — no rebuild needed. |
| `HRE_API_SECRET`     | unset        | Required in production: all `/api/v1/*` routes validate a `Bearer` token.                                     |

## PWA

The site installs as a standalone PWA on Android Chrome and iOS Safari. The service worker is produced by [`@ducanh2912/next-pwa`](https://github.com/DuCanhGH/next-pwa) (workbox).

### Running PWA locally

`@ducanh2912/next-pwa` only emits the service worker under **webpack**; Next 16 defaults to Turbopack, so the build script uses `next build --webpack`. The service worker is disabled in `next dev`.

```bash
npm run build      # next build --webpack — emits public/sw.js + workbox-*.js
npm start          # serves the production build on :3000
```

To exercise the PWA on a tablet, hit the dev machine over the LAN (`http://192.168.x.x:3000`) or proxy through HTTPS (e.g. `npx serve` + `mkcert`). PWA install requires either `localhost` or HTTPS — plain LAN HTTP shows the install prompt on Chrome but not Safari.

### Installing on a device

- **Android Chrome**: visit the URL → tap menu → *Install app*.
- **iOS Safari**: visit the URL → Share → *Add to Home Screen*.

### Reinstalling on iPad (for testing major PWA changes)

Day-to-day you do **not** need to reinstall — the runtime caching is set up so that every new build auto-replaces the old service worker on the next cold launch (`skipWaiting: true` + `clientsClaim: true` are baked into `@ducanh2912/next-pwa`).

If you need a fully clean slate (testing the manifest, splash screens, or the `start_url` behavior), force a reinstall:

1. Long-press the home-screen icon → *Remove App* → *Delete App*.
2. Open Safari → *Settings* (iOS) → *Safari* → *Advanced* → *Website Data* → search for the host → swipe-delete it.
3. Reopen the URL in Safari → Share → *Add to Home Screen*.

This guarantees the OS-level icon, manifest values, and apple-touch-startup-image set come from the latest build.

### Updating the installed PWA

The runtime caching is tuned so that the iPad picks up new builds on the next cold launch:

| Resource                                  | Strategy             | Notes                                              |
| ----------------------------------------- | -------------------- | -------------------------------------------------- |
| `/_next/static/*` (content-hashed assets) | StaleWhileRevalidate | URLs change per build; safe to serve cached first  |
| HTML documents + RSC payloads             | NetworkFirst (3 s)   | Falls back to `/offline` if the network is dead    |
| `/_next/image*`, Unsplash, fonts          | StaleWhileRevalidate | Long-lived, busted by URL change                   |
| `/api/*`, REST                            | NetworkOnly          | Auth-gated, mutating — never cached                |
| Server Actions (POST + `next-action`)     | NetworkOnly + Background Sync | Failed POSTs are queued and replayed on reconnect (`hre-actions-queue`, 24 h retention) |
| `/manifest.webmanifest`, `/icons/*`       | StaleWhileRevalidate | App icons survive offline relaunches               |

After flipping `HRE_USE_DATABASE` you do **not** need to rebuild or reinstall the PWA — the root layout is `force-dynamic` so the value is read at request time.

### Offline support

`/offline` is precached and served when the network is dead during a navigation. A live "Offline — changes will sync when you reconnect" banner (`components/offline-banner.tsx`) appears at the top of every page on the guest and management layouts.

## Scripts

| Command             | What                                                |
| ------------------- | --------------------------------------------------- |
| `npm run dev`       | Dev server (Turbopack, no SW)                       |
| `npm run build`     | Production build with webpack + SW                  |
| `npm start`         | Serve the production build                          |
| `npm run lint`      | ESLint                                              |
| `npm run db:migrate`| `prisma migrate dev`                                |
| `npm run db:seed`   | `prisma db seed`                                    |
| `npm run db:generate`| Regenerate Prisma client                           |

## Project layout

- `app/` — App Router routes (guest tablet, management dashboard, API v1, manifest, offline)
- `components/` — Shared client components
- `contexts/demo-context.tsx` — Demo state machine + dual storage (Prisma vs localStorage)
- `lib/server/*` — Prisma helpers, schemas, API auth
- `lib/i18n/locales/*` — EN / NL / ES / PT translations
- `prisma/` — Schema, migrations, seed
- `public/icons/`, `public/splash/` — PWA icons + iOS launch screens

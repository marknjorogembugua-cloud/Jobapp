# Amon — Skilled Hands, Trusted Work

Gig marketplace connecting Kenyan customers with verified informal workers. See `docs/PRD.md` and `docs/SRS.md` for product scope and requirements; this file covers running what's built so far.

## Structure

```
apps/api/     NestJS backend (auth, categories, workers, bookings, chat, reviews, payments, notifications)
apps/mobile/  React Native (Expo) app — customer + worker flows
apps/admin/   Vite + React web app — worker approval console
packages/shared/  Shared TS types between api, mobile and admin
docs/         PRD, SRS
```

## What's actually working right now

Every module in the PRD's Phase 0 + Phase 1 list is implemented and wired end-to-end (builds clean, backend test suite passes, mobile/admin typecheck clean). None of it has been run against live infrastructure in this environment — see "What you still need to do" below.

- **Auth**: Firebase ID token → backend session exchange → app JWT (access + refresh), role-based guards, first-login role assignment (customer/worker only — admin can't self-register, see below). Phone-OTP UI is stubbed — see note in `apps/mobile/src/api/auth.ts`, it needs `@react-native-firebase/auth` for native reCAPTCHA, not just the JS SDK.
- **Mobile — discovery & booking**: Login/register (with a customer/worker role toggle), Home (search + categories + nearby workers), Worker profile (Call/WhatsApp/Open-in-Maps shortcuts, reviews list), Booking request form, booking list + detail screen (accept/decline, mark complete, status tracking).
- **Mobile — worker onboarding**: profile form + ID/selfie upload. ID photo and selfie go to a **private** Firebase Storage path — the public API never returns their URL, only an `idPhotoUploaded`/`selfieUploaded` boolean; only the admin app can view them, via short-lived signed URLs. Profile photos are public since they're shown on listings. Editing an approved profile sends it back to `pending_review`.
- **Chat**: text + image messages scoped to a booking thread, mobile screen polls every 4s (no websockets — kept simple for this phase). Chat images are stored in a public Storage path (lower sensitivity than KYC docs).
- **Reviews**: one review per completed booking, updates the worker's `ratingAverage`/`ratingCount`, shown on the worker's public profile.
- **Push notifications**: Expo push tokens registered on login, sent on new booking / accept / decline / completion, new chat message, review received, and worker approval/rejection. Best-effort — a missing token or send failure never breaks the request that triggered it.
- **M-Pesa (Daraja STK Push)**: `POST /bookings/:id/pay` initiates an STK push, `POST /payments/mpesa/callback` is the public webhook Safaricom calls back, mobile polls payment status. **Needs your own Daraja sandbox/production credentials — entirely unverified against the real API in this environment.**
- **Map**: "Open in Maps" on the worker profile deep-links to Google Maps with the worker's lat/lng — deliberately not an embedded map, since `react-native-maps` needs a native module and would break the app's current zero-prebuild-config Expo setup (see "Building with EAS").
- **Admin app** (`apps/admin`): email/password login (Firebase, same project as mobile), lists workers pending review, lets you load their KYC docs on demand (signed URLs, not stored anywhere) and approve/reject.

## What you still need to do

None of the following can be done for you — they need your own accounts/credentials:

1. **Postgres** — provision a database and run migrations (see below). Nothing in `apps/api` has touched a real database in this environment.
2. **Firebase Storage** — set `FIREBASE_STORAGE_BUCKET` in `apps/api/.env`. Needed for worker uploads and chat images.
3. **First admin account** — there's no API route to self-register as admin (`CreateSessionDto` only accepts `customer`/`worker`, on purpose — see `apps/api/src/auth/dto/create-session.dto.ts`). Register normally through the mobile app once, then run:
   ```bash
   npm run admin:promote --workspace=apps/api -- you@example.com
   ```
4. **M-Pesa Daraja credentials** — sign up at developer.safaricom.co.ke for a sandbox app, fill `MPESA_*` in `apps/api/.env`. `MPESA_CALLBACK_URL` must be a publicly reachable URL (use `ngrok` or similar in dev).
5. **EAS account** — see "Building with EAS" below.

## Prerequisites

- Node 20+
- A Postgres database (local via `pg_ctlcluster`/Docker, or hosted)
- A Firebase project with a **service account** (backend), a **Storage bucket**, and a **web app config** (used by both the mobile app and the admin web app)
- Expo Go app on your Android phone (fastest way to run the mobile app during development), or an Android emulator

## Running the backend

```bash
cd apps/api
cp .env.example .env        # fill in DATABASE_URL, JWT secrets, Firebase service account + storage bucket, M-Pesa creds
npm run prisma:migrate      # creates tables from prisma/schema.prisma
npm run start:dev
```

Health check: `GET http://localhost:3000/v1/health`

## Running the mobile app

```bash
cd apps/mobile
# Create a .env with EXPO_PUBLIC_* Firebase web config and EXPO_PUBLIC_API_URL
# (your machine's LAN IP:3000/v1, not localhost, if testing on a real device)
npm run start
```

Scan the QR code with Expo Go.

## Running the admin app

```bash
cd apps/admin
cp .env.example .env   # VITE_API_URL + the same Firebase web app config as mobile
npm run dev
```

Log in with an account you've promoted to admin (see step 3 above).

## Building with EAS

`apps/mobile` is a standard Expo **managed** app — no custom native modules (Firebase auth uses the JS SDK, not `@react-native-firebase`; the map is a Linking deep-link, not `react-native-maps`), so `eas build` works with zero prebuild config. `eas.json` is already in place with `development`/`preview`/`production` profiles.

One-time setup (needs your own Expo account — can't be done for you):

```bash
npm install -g eas-cli
cd apps/mobile
eas login
eas init          # links this app to an Expo project, writes extra.eas.projectId into app.json
```

Then:

```bash
eas build --platform android --profile preview   # installable APK, good for testing on real devices
eas build --platform android --profile production # AAB for Play Store
eas submit --platform android                      # push straight to Play Console, once you have a listing
```

iOS builds work the same way (`--platform ios`) but need an Apple Developer account; the PRD scopes iOS as secondary, not launch-blocking.

## Tests

```bash
npm run api:test    # backend: Jest unit tests
```

`apps/mobile` and `apps/admin` have no test files yet — `npx tsc --noEmit` in each is currently the only automated check.

## Next up

Everything in the PRD's Phase 0 + Phase 1 scope is built. What's left is entirely about connecting real infrastructure (see "What you still need to do") and then exploratory hardening once it's running against live traffic — e.g. rate limiting the M-Pesa callback endpoint, websocket-based chat instead of polling, and iOS builds.

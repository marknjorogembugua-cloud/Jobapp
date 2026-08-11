# Software Requirements Specification (SRS)

## Amon — Phase 0

**Status:** Draft v0.1. Scope = Phase 0 only (see PRD §6). Later phases get their own SRS addenda when we get there.

---

## 1. Architecture Overview

```
apps/
  mobile/   React Native (Expo) — customer + worker app, single codebase, role-based UI
  api/      NestJS — REST API, modular by domain
  admin/    (Phase 1) React admin dashboard — not built in Phase 0
packages/
  shared/   Shared TypeScript types/DTOs between mobile and api
```

- **Mobile:** React Native + Expo (managed workflow) — faster iteration, OTA updates, good enough for Phase 0; can eject later if a native module forces it.
- **Backend:** NestJS (modular monolith, not microservices — premature at this stage), REST over JSON.
- **Database:** PostgreSQL via Prisma ORM.
- **Auth:** Firebase Auth (phone OTP, Google, email) on the client; backend verifies Firebase ID tokens and issues its own short-lived JWT + refresh token for API calls.
- **File storage:** S3-compatible bucket for ID photos, profile photos, portfolio images (provider TBD — stubbed behind an interface so swapping is cheap).
- **Push notifications:** Firebase Cloud Messaging.
- **Payments (Phase 1, not Phase 0):** M-Pesa Daraja STK Push.

## 2. Functional Requirements — Phase 0

### FR-1 Authentication
- FR-1.1 User signs up/logs in via phone OTP, Google, or email (Firebase client SDK).
- FR-1.2 On first login, client sends Firebase ID token to `POST /auth/session`; backend verifies it, creates/finds the User record, returns app JWT (access + refresh).
- FR-1.3 User selects role at signup: Customer or Worker (a user can hold both roles on one account in a later phase; Phase 0 is single-role).

### FR-2 Worker Onboarding
- FR-2.1 Worker completes profile: photo, full name, business name (optional), profession/category, bio, skills, years of experience, county, town, GPS pin, languages, working hours, starting price.
- FR-2.2 Worker uploads National ID photo + selfie. Status starts `pending_review`.
- FR-2.3 Admin manually approves/rejects via admin dashboard (Phase 0 admin dashboard is minimal — see FR-8).
- FR-2.4 Worker cannot receive bookings until status = `approved`.

### FR-3 Customer Home & Search
- FR-3.1 Home shows search bar, category grid, nearby approved workers (by county/town — GPS-radius search is Phase 1).
- FR-3.2 Search filters: category, county/town, text query. Sort: rating (once reviews exist), price.
- FR-3.3 Worker profile view: all FR-2.1 fields + ratings summary + reviews list.

### FR-4 Booking
- FR-4.1 Customer submits booking request: date, time window, job description, up to 5 photos, address text, budget (optional).
- FR-4.2 Worker sees pending requests, can Accept or Decline (no negotiation in Phase 0).
- FR-4.3 Customer sees booking status: `pending → accepted/declined → completed/cancelled`.
- FR-4.4 Either party can mark a booking `completed` after the scheduled time; both must confirm (2-sided confirmation) before it's final and reviewable.

### FR-5 Chat
- FR-5.1 Text + image messages, scoped to a booking thread.
- FR-5.2 Push notification on new message.
- FR-5.3 "Call" button (native dialer) and "WhatsApp" deep link (`https://wa.me/<number>`) on the thread and on the worker profile.

### FR-6 Reviews
- FR-6.1 After a booking is marked `completed`, customer leaves a 1–5 star rating + text review.
- FR-6.2 Review appears on worker profile; average rating recalculated.

### FR-7 Notifications
- FR-7.1 Push via FCM for: new booking request, booking accepted/declined, new chat message, review received.

### FR-8 Admin (minimal, Phase 0)
- FR-8.1 Web-based (simple, unstyled-is-fine) admin: list pending workers, view ID/selfie, approve/reject.
- FR-8.2 List all bookings, all users; suspend a user account.
- Full analytics/dispute/featured-worker admin tooling is Phase 1.

## 3. Non-Functional Requirements

- **NFR-1 Performance:** Home screen interactive in <3s on a mid-tier Android device over 3G.
- **NFR-2 Offline tolerance:** Viewing already-loaded bookings/profile data works offline; writes queue and retry on reconnect (Phase 0: at minimum, fail with a clear "you're offline" state rather than silently losing input).
- **NFR-3 Security:** All API endpoints require a valid JWT except public search/browse. Role-based guards (Customer/Worker/Admin) on every mutating endpoint. Passwords are never stored — auth is delegated to Firebase. File uploads are validated for type/size server-side before accepting.
- **NFR-4 Data privacy:** National ID photos and selfies are stored in a private (non-public) bucket path, accessible only to the uploading user and admin roles.
- **NFR-5 Localization-ready:** All user-facing strings pulled from a strings table/i18n layer from day one (English + Swahili), even if only English is populated in Phase 0.
- **NFR-6 Testability:** Every module ships with unit tests for business logic (services) and at least one integration test per API route before it's considered done, per the PRD's "no Phase N+1 until Phase N is tested" rule.

## 4. Data Model — Phase 0 (entities, not full DDL)

`User (id, firebaseUid, role, phone, email, name, createdAt)`
`WorkerProfile (userId, category, bio, skills[], yearsExperience, county, town, lat, lng, languages[], startingPrice, workingHours, status[pending_review|approved|rejected|suspended], idPhotoUrl, selfieUrl, profilePhotoUrl)`
`Category (id, name, icon)`
`Booking (id, customerId, workerId, categoryId, date, timeWindow, description, photos[], address, budget, status, customerConfirmedAt, workerConfirmedAt)`
`Message (id, bookingId, senderId, type[text|image], body, createdAt)`
`Review (id, bookingId, rating, text, createdAt)`

Full Prisma schema is the next artifact once this SRS is approved (or immediately, since we're moving fast — see repo scaffold).

## 5. API Conventions

- REST, versioned under `/v1`.
- Auth: `Authorization: Bearer <jwt>`.
- Errors: `{ "error": { "code": "STRING_CODE", "message": "human readable" } }`, consistent HTTP status codes.
- Pagination: `?page=&pageSize=`, response includes `{ data, total, page, pageSize }`.

## 6. Testing Strategy

- Backend: Jest unit tests per service, Supertest integration tests per controller, run in CI on every push.
- Mobile: Jest + React Native Testing Library for components/screens; critical flows (login, booking) get at least one integration test.
- No module is marked done without its tests green — enforced by task tracking, not just convention.

## 7. Deployment (Phase 0 target)

- API: containerized (Dockerfile provided), deployable to any container host — provider TBD (see PRD open dependency).
- DB: managed Postgres (provider TBD).
- Mobile: Expo EAS Build for Android APK/AAB during development; Play Store release is a later milestone.

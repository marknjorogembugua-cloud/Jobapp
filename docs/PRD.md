# Product Requirements Document (PRD)

## Amon — "Skilled Hands, Trusted Work"

*(Name from Hebrew אָמוֹן, "master craftsman" — Proverbs 8:30)*

**Status:** Draft v0.1 — pending stakeholder review
**Owner:** TBD
**Last updated:** 2026-08-11

---

## 1. Vision

Make hiring a verified local worker in Kenya as easy, fast, and trustworthy as ordering a ride. Amon connects customers with informal-sector professionals — electricians, plumbers, fundis, cleaners, tutors, boda riders, and more — through a mobile-first, low-bandwidth-friendly app built around M-Pesa payments and WhatsApp-adjacent communication habits.

## 2. Problem Statement

Today, Kenyans find workers through word-of-mouth, WhatsApp groups, or roadside signage. This is slow, unverified, and non-transferable across neighborhoods. Workers have no way to build a portable reputation; customers have no way to compare, book, or pay safely. There is no dominant, trusted, Kenya-first platform solving this at scale.

## 3. Target Users & Personas

### 3.1 Customer — "Wanjiku," 29, Nairobi
Owns a mid-range Android phone, intermittent data bundles, pays via M-Pesa for everything, distrusts unknown numbers, prefers to see ratings/photos before calling anyone.

### 3.2 Worker — "Otieno," 34, electrician, Kisumu
Has a basic-to-mid Android phone, limited literacy with complex apps, wants more jobs without paying middlemen, needs to show off completed work and certificates to win trust.

### 3.3 Admin — Amon operations staff
Needs to approve/verify workers quickly, moderate disputes and reviews, and see platform health at a glance.

## 4. Goals & Success Metrics

| Goal | Metric | Target (6 months post-launch) |
|---|---|---|
| Liquidity | Verified active workers per major category, per county | ≥50 in Nairobi, ≥15 in 3 other counties |
| Trust | % of bookings completed without dispute | ≥95% |
| Conversion | Search → booking request rate | ≥15% |
| Retention | Worker week-4 retention | ≥40% |
| Payments | % of bookings paid in-app (deposit or full) | ≥60% |
| Performance | App usable on 2G/3G, cold start | <3s to interactive on mid-tier device |

## 5. Non-Negotiable Design Constraints (Kenya context)

- Primary device: low/mid-end Android. iOS is secondary, not launch-blocking.
- Assume unreliable connectivity — critical flows (viewing bookings, chat drafts, worker profile basics) must degrade gracefully offline and sync when back online.
- M-Pesa STK Push is the default payment rail, not a bolt-on.
- Voice input and large tap targets matter more than dense text UI — many users are first-time smartphone owners.
- WhatsApp is a trusted communication channel; the app should complement it (e.g., "Continue on WhatsApp" shortcuts), not fight it.
- Every screen should work for a user who reads Swahili and/or English; avoid English-only jargon in critical flows.

## 6. Scope — Phased

The full feature list in the source brief is large enough to be its own multi-quarter roadmap. This PRD phases it so the first shippable module is real and testable rather than a partial slice of everything.

### Phase 0 — Foundation (build first)
- Phone OTP + Google + email auth (customer & worker)
- Worker onboarding: profile, skills, category, pricing, photo, ID upload (manual admin review, no auto-verification yet)
- Customer home: search by category + location, worker profile view
- Direct booking request (date/time/description/photos) — no negotiation/counter-offer yet
- Worker accept/decline
- In-app chat (text + images only; voice notes/location come later)
- Phone call + WhatsApp deep-link shortcut
- Cash payment as the only payment method (M-Pesa STK Push is Phase 1)
- Basic push notifications (new booking, accepted, cancelled)
- Star rating + text review after job completion
- Minimal admin dashboard: approve workers, view bookings, suspend accounts

### Phase 1 — Trust & Payments
- M-Pesa STK Push deposits + full payment, transaction history, receipts
- ID + selfie verification workflow, verification badges
- Map view of nearby workers, distance/ETA
- Advanced search/sort (rating, price, distance, verified, open now)
- Voice notes, location sharing, typing/read receipts in chat
- Trust badges (Top Rated, 100 Jobs Completed, Fast Response, etc.)
- Favourites, recently viewed, booking tracking
- Dispute resolution flow in admin dashboard
- Analytics dashboard for admin (revenue, growth, category demand)

### Phase 2 — Growth & Differentiation
- Negotiation/counter-offer on bookings, milestone payments, refund workflow
- Emergency service flag + surfacing
- AI recommendations, trending/popular categories, special offers
- Featured worker placements (admin-managed)
- Worker-rates-customer, repeat-customer badges
- Portfolio video uploads
- Dynamic admin-managed categories
- Video consultation (future-ready hook only, not full implementation)
- Wallet (future-ready hook only)
- Background verification integration (future, pending vendor selection)

**Rule for this project:** we do not start Phase N+1 work until Phase N is feature-complete and tested. See SRS §9 for the testing bar each module must clear before moving on.

## 7. Out of Scope (explicitly, for now)

- iOS App Store polish/parity (Android-first)
- Multi-country expansion (Kenya only)
- In-house background-check/criminal-record verification (flagged as future, needs a vendor/legal review)
- Native video calling infrastructure (Phase 2 stub at most)

## 8. Key Risks & Open Dependencies

| Risk / Dependency | Impact | Notes |
|---|---|---|
| M-Pesa Daraja API access (production credentials) | Blocks Phase 1 payments | Not yet confirmed — sandbox first |
| Google Maps API key & billing | Blocks map view, distance/ETA | Not yet confirmed |
| Firebase project | Auth (phone OTP/Google) + push notifications | **Already available** — will wire real config, not stubs |
| Cloud hosting decision (AWS/GCP/Azure/other) | Backend deployment target | Not yet confirmed |
| Worker verification process ownership | Who manually reviews ID uploads at launch? | Needs an operational owner, not just tech |
| Content moderation policy for reviews/chat | Legal/trust exposure | Needs a written policy before Phase 1 launch |

## 9. Open Questions for Stakeholder

1. Launch geography: Nairobi-only first, or multiple counties from day one?
2. Monetization model: commission per booking, worker subscription, featured-listing fees, or a mix?
3. Who staffs manual worker-verification review at launch (admin ops headcount)?
4. Any existing brand assets (logo, color direction) or should design start from scratch under the Amon name?
5. Target launch date / any external deadline (investor demo, pilot city rollout, etc.)?

---

*Next deliverable: Software Requirements Specification (SRS), covering functional/non-functional requirements, architecture, and data model for Phase 0.*

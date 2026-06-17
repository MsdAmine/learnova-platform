# Known Limitations

This document consolidates the platform's current known gaps for the PFA
report, so that `project-overview.md` and `core-workflows.md` can stay
focused on what is implemented. Source: `CURRENT_STATE.md` "Known Gaps" and
"Still mocked or placeholder" sections, cross-checked against the router and
controllers.

## Features owned elsewhere / explicitly out of scope here

- **Live sessions** — no backend exists. `LiveSessionsPage`
  (`/dashboard/live-sessions`) is frontend placeholder/mock only.

## Certificates

Certificates are implemented end-to-end (backend module + `CertificatesPage`,
`CertificateViewPage`, and a certificate panel in `CoursePlayerPage` — see
`core-workflows.md` §9 and `use-cases.md` UC-28), with these real, code-backed
limitations:

- **Issuance is manual, not automatic.** A learner must explicitly click
  "Issue certificate" from the course player's certificate panel; there is no
  background job or completion hook that creates a `Certificate` row without
  that click.
- **Certificate availability depends on course completion.** The panel only
  appears once `Enrollment.progressPercentage` reaches 100%; issuing for a
  non-`COMPLETED` enrollment is rejected by the backend with `409`.
- **No PDF generation, download, sharing, QR code, or revocation.** The
  certificate view page offers only a browser "Print / Save as PDF" button
  (`window.print()`); there is no server-rendered PDF, no email/LinkedIn
  share action, no QR/verification code, and no revoke or regenerate flow.
- **No certificate-issuance trigger from anywhere except the course player.**
  `CertificatesPage` (the certificates list) only reads existing certificates
  — it does not itself offer an issuance action.

## Course content and player

- The course player's lesson content area is a placeholder panel — no rich
  text, video, or lesson-body rendering exists.
- No public syllabus/section previews, instructor bio endpoint, course
  duration, or lesson count on the public catalog/detail pages (no backend
  contract for any of these).
- No media/file upload; `thumbnailUrl` and `profileImageUrl` are plain URL
  strings with no upload pipeline.
- No question/answer-option or section/lesson ordering — items are always
  appended; there is no drag-reorder.

## Quizzes

- No attempt-history UI — learners can start a new attempt, but there is no
  list of past attempts or a way to review earlier results.
- No dedicated retake flow — starting the same quiz again creates a new
  attempt; there is no retake CTA after viewing a result.
- No timers/duration fields on quizzes.
- No quiz analytics or learner-results dashboard for instructors.
- No certificate integration tied to quiz passing — certificate issuance
  (see the **Certificates** section above) is keyed only to lesson/course
  progress reaching 100%, not to quiz results.
- v1 supports exactly one selected option per question — no multi-select /
  partial-credit question type.
- No unpublish or restore-from-archived flow for quizzes; publish is
  one-directional (`DRAFT → PUBLISHED`), archive is terminal.

## Wishlist

- No per-course wishlist-status endpoint; saved state is derived client-side
  from a single `GET /api/v1/wishlist?size=200` call (a v1 page-size cap).
- No automatic removal from the wishlist after enrollment — wishlist and
  enrollment are independent at both backend and frontend layers.
- Catalog cards (`CourseCatalogCard`) intentionally do not yet show
  save/unsave controls; the wishlist action exists only on the course detail
  page and the saved-courses dashboard page.

## Profiles and admin

- No profile-switcher UI component — the backend endpoint
  (`POST /api/v1/profile/switch`) exists, but nothing in the frontend calls
  it yet.
- No admin user-management capability beyond instructor approvals and
  category creation; there is no broader admin console.

## Dashboard

- The weekly activity chart and some learner dashboard sections are
  placeholder/mock content.
- `ProgressPage` shows enrollment-level progress only — no per-lesson
  breakdown view.

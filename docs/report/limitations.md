# Known Limitations

This document consolidates the platform's current known gaps for the PFA
report, so that `project-overview.md` and `core-workflows.md` can stay
focused on what is implemented. Source: `CURRENT_STATE.md` "Known Gaps" and
"Still mocked or placeholder" sections, cross-checked against the router and
controllers.

## Features owned elsewhere / explicitly out of scope here

- **Certificates** — owned by another developer. No certificate backend
  exists in this codebase. `CertificatesPage` (`/dashboard/certificates`) is
  a frontend placeholder page with no backend contract behind it. Do not
  present certificate issuance as implemented.
- **Live sessions** — no backend exists. `LiveSessionsPage`
  (`/dashboard/live-sessions`) is frontend placeholder/mock only.

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
- No certificate integration tied to quiz passing (depends on the
  certificates module, which does not exist here).
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

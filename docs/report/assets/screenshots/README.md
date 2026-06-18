# Screenshot Inventory

Final report/demo screenshots for the Learnova PFA report and presentation,
captured from a running local dev instance (frontend `npm run dev` on
`http://localhost:5173`, backend `./mvnw spring-boot:run` on
`http://localhost:8080`) using the seeded demo accounts:

- `demo.learner@learnova.dev`
- `demo.instructor@learnova.dev`
- `demo.admin@learnova.dev`
- Password for all three: `Password123!`

Desktop screenshots use a 1440×900 viewport; the mobile screenshot uses
390×844. Each browser session started from a cleared `localStorage` (no
stale session reused) before logging in with the relevant demo account.

This is manual browser-QA evidence of what the running application looks
like — it is not an automated test and does not by itself prove backend
correctness (see `docs/report/testing-summary.md` for that evidence).

The older screenshot set referenced from `docs/report/README.md`
(`01-public-catalog.png`, `02-learner-dashboard.png`,
`03-course-player-lessons.png`, `04-course-player-quiz-result.png`,
`05-instructor-content-builder.png`, `06-admin-instructor-approvals.png`,
`mobile-course-player.png`, `mobile-settings.png`) predates this pass and is
left in place; it is superseded in coverage by the numbered set below but
not deleted, since `docs/report/README.md` was not in scope for this task.

## Data side effects from this capture session

Capturing certificate and content-builder evidence required two real,
additive actions through the actual app flows (no direct database edits,
no fabricated data):

1. **Course completion + certificate issuance** — as `demo.learner`, the two
   remaining lessons in "React Fundamentals for Beginners" (course id 2)
   were marked complete via the real "Mark as complete" button, then a
   certificate was issued via the real "Issue certificate" action
   (`POST /api/v1/learner/certificates/course/2/issue`). This is
   irreversible demo-account state: the learner's enrollment is now 100%/
   COMPLETED and a real certificate (id 4) exists. It directly produced
   screenshots 07 and 08, and changed the on-screen stats in 03 and 04
   (now showing 1 completed course and 1 certificate instead of 0).
2. **Course content authoring** — as `demo.instructor`, one section
   ("Course Overview") and one lesson ("Welcome to the Course") were added
   to "QA Quiz Course" (course id 13) via the real instructor
   content-builder form, because both of that instructor's existing
   courses had zero sections/lessons. This produced screenshot 13. No
   existing section/lesson was edited or deleted.

No instructor-approval requests were approved or rejected, no live session
was created/cancelled/joined, and no other persistent demo data was
modified.

## Known data caveats

- The public catalog (`/courses`) mixes a handful of genuine course entries
  with leftover QA/test seed data (titles like "test", "amine preview",
  "QA Test Published Course"). This is the cleanest available state without
  fabricating new catalog data; screenshot 01 is captured as-is.
- Screenshot 05 (course player — Lessons tab) was captured while course 2
  was still at 33% (1 of 3 lessons complete), before the completion flow
  described above. It is accurate for the moment it was captured and still
  correctly demonstrates lesson navigation, progress, and the active-tab/
  selected-row accent treatment; it is simply earlier in the same course's
  timeline than screenshots 03/04/07/08.
- Instructor live-session screenshot 10 shows real Jitsi meeting URLs
  (`https://meet.jit.si/learnova-live-<random>`). Per the live-sessions
  design, the unguessable room name is itself the v1 access boundary; these
  are disposable demo rooms, not production secrets, and the instructor
  viewing them is their own session owner.

## Inventory

| # | Filename | Route / page | Actor | Viewport | Proves | Side effects / caveats | Status |
|---|---|---|---|---|---|---|---|
| 01 | `01-public-catalog-desktop.png` | `/courses` | Guest | 1440×900 | Real public course catalog, category filter, accent category badges, enrolled-vs-enroll CTA state | Catalog mixes real and QA/test seed courses (see caveats) | Report-ready, with caveat noted |
| 02 | `02-public-course-detail-desktop.png` | `/courses/2` | Guest | 1440×900 | Public course detail info, accent category badge, honest CTA (no price/rating/duration claims) | None | Report-ready |
| 03 | `03-learner-dashboard-desktop.png` | `/dashboard` | demo.learner | 1440×900 | Real learner dashboard: enrollment stats, Continue Learning, My Courses, real Certificates section (no mock live sessions) | Captured after course-2 completion; shows 1 completed course + 1 certificate | Report-ready |
| 04 | `04-progress-page-desktop.png` | `/dashboard/progress` | demo.learner | 1440×900 | Real enrollment/progress data, no weekly-activity mock | Captured after course-2 completion | Report-ready |
| 05 | `05-course-player-lessons-desktop.png` | `/dashboard/courses/2` (Lessons tab) | demo.learner | 1440×900 | Lesson layout, per-lesson progress, selected-lesson accent row, course outline | Captured at 33% complete, before the later completion flow (see caveats) | Report-ready |
| 06 | `06-course-player-quiz-history-desktop.png` | `/dashboard/courses/13` (Quizzes tab) | demo.learner | 1440×900 | Quiz retake/attempt-history UI, passed result, expanded attempt history (2 attempts) | None (pre-existing real attempts, not fabricated for this session) | Report-ready |
| 07 | `07-certificates-list-desktop.png` | `/dashboard/certificates` | demo.learner | 1440×900 | Real certificate list with one issued certificate; honest "no download/PDF/share" framing | Reflects the certificate issued in this session (see side effects) | Report-ready |
| 08 | `08-certificate-view-desktop.png` | `/dashboard/certificates/4` | demo.learner | 1440×900 | Real certificate view page (name, course, instructor, issue date, verification code, Print/Save-as-PDF only) | Certificate was issued in this session via the real flow, not fabricated | Report-ready |
| 09 | `09-learner-live-sessions-desktop.png` | `/dashboard/live-sessions` | demo.learner | 1440×900 | Real backend-backed upcoming session list with Join action; no fake links | None | Report-ready |
| 10 | `10-instructor-live-sessions-desktop.png` | `/instructor/live-sessions` | demo.instructor | 1440×900 | Schedule/list/cancel UI for Jitsi-backed live sessions; SCHEDULED and CANCELLED states | Real Jitsi room URLs visible (disposable demo rooms, not production secrets — see caveats) | Report-ready |
| 11 | `11-instructor-courses-desktop.png` | `/instructor/courses` | demo.instructor | 1440×900 | Instructor course management list; Draft and Published status badges with accent treatment | None | Report-ready |
| 12 | `12-instructor-quizzes-desktop.png` | `/instructor/courses/13/quizzes` | demo.instructor | 1440×900 | Instructor quiz management; Draft and Published quiz badges | None | Report-ready |
| 13 | `13-instructor-content-builder-desktop.png` | `/instructor/courses/13/content` | demo.instructor | 1440×900 | Course sections/lessons builder with a populated section and lesson | One section + one lesson added via the real authoring flow (see side effects) | Report-ready |
| 14 | `14-admin-approvals-desktop.png` | `/admin/instructor-approvals` | demo.admin | 1440×900 | Admin instructor-approval workflow; Pending badges; Approve/Reject controls visible | Two real pending requests shown; neither was approved or rejected | Report-ready |
| 15 | `15-instructor-mobile-nav-390.png` | `/instructor/courses` | demo.instructor | 390×844 | Mobile instructor nav exposes both "Courses" and "Live sessions" links | None | Report-ready |
| 16 | `16-settings-profile-image-desktop.png` | `/dashboard/settings` | demo.learner | 1440×900 | Real Cloudinary-backed learner profile-image upload UI (preview placeholder + Upload photo control) | No upload was performed in this session; only the UI is shown | Report-ready |

## Skipped from the original request list

None of the 16 requested screenshots were skipped — all were captured,
including the certificate view (08), which was conditional on a real
certificate existing or being issuable safely.

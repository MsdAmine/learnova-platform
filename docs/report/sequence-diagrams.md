# Sequence Diagrams

## Scope

The diagrams below reflect the current, implemented state of the system —
they are derived from the actual controllers and services under
`backend/src/main/java`, not from planned or aspirational behavior. They
complement `docs/report/core-workflows.md` (textual workflow descriptions)
and `docs/report/class-diagram.md` (domain model) with a call-sequence view
for the four flows most relevant to the PFA demo. Internal helper method
calls are omitted in favor of readability; only the participant-to-participant
calls relevant to each flow are shown.

---

## 1. Instructor Application and Approval

```mermaid
sequenceDiagram
    actor Learner
    participant SettingsPage
    participant API as Auth/API client
    participant IPC as InstructorProfileController
    participant AdminPage as AdminInstructorApprovalsPage
    participant AdminCtrl as AdminInstructorProfileController
    participant DB as User/Role persistence

    Learner->>SettingsPage: Open Settings
    Learner->>SettingsPage: Submit instructor application (bio, expertise, optional experience/motivation)
    SettingsPage->>API: POST /api/v1/instructor-profile/request
    API->>IPC: forward request
    IPC->>DB: create InstructorProfile (approvalStatus = PENDING)
    DB-->>IPC: saved profile
    IPC-->>SettingsPage: 201 InstructorProfileResponse (PENDING)
    SettingsPage-->>Learner: show "pending review" status

    Note over AdminPage,AdminCtrl: Admin reviews applications

    AdminPage->>AdminCtrl: GET /api/v1/admin/instructor-profiles/pending
    AdminCtrl->>DB: find by approvalStatus = PENDING
    DB-->>AdminCtrl: pending list
    AdminCtrl-->>AdminPage: 200 list of pending profiles

    alt Admin approves
        AdminPage->>AdminPage: confirmation prompt
        AdminPage->>AdminCtrl: POST /api/v1/admin/instructor-profiles/{id}/approve
        AdminCtrl->>DB: set approvalStatus = APPROVED, reviewedAt = now
        AdminCtrl->>DB: grant ROLE_INSTRUCTOR to the user
        DB-->>AdminCtrl: saved profile
        AdminCtrl-->>AdminPage: 200 InstructorProfileResponse (APPROVED)
        Learner->>API: GET /api/v1/auth/me (session/profile refresh)
        API-->>Learner: availableProfiles now includes INSTRUCTOR
        Learner->>Learner: navigate to /instructor/courses
    else Admin rejects
        AdminPage->>AdminCtrl: POST /api/v1/admin/instructor-profiles/{id}/reject (reason)
        AdminCtrl->>DB: set approvalStatus = REJECTED, rejectionReason, reviewedAt = now
        DB-->>AdminCtrl: saved profile
        AdminCtrl-->>AdminPage: 200 InstructorProfileResponse (REJECTED)
        Learner->>SettingsPage: reopen Settings later
        SettingsPage->>API: GET /api/v1/instructor-profile/me
        API-->>SettingsPage: REJECTED + rejectionReason
        SettingsPage-->>Learner: show rejected status and reason
    end
```

**Notes:**
- **Status transitions** — an instructor profile starts `PENDING` on
  request and moves to exactly one of `APPROVED` or `REJECTED`; there is no
  reverse transition modeled in the backend.
- **Role grant** — `ROLE_INSTRUCTOR` is granted on the `User` entity at the
  moment of approval (`InstructorProfileService.approveInstructorProfile`).
  It is **admin approval, and only admin approval, that grants instructor
  access** — there is no self-service path to the role.
- **Session refresh** — the frontend does not get the new role pushed to
  it; it must re-fetch `/api/v1/auth/me` (via `useCurrentUser` or an
  equivalent refresh) to see `availableProfiles` updated before instructor
  routes become reachable.
- **Rejection branch** — rejection stores a `rejectionReason` and
  `reviewedAt` but does not grant any role; the Settings page surfaces this
  reason on a later visit via `GET /api/v1/instructor-profile/me`.

---

## 2. Learner Enrollment and Lesson Progress

```mermaid
sequenceDiagram
    actor Learner
    participant Detail as Public CourseDetailPage
    participant EnrollCtrl as EnrollmentController/Service
    participant Player as CoursePlayerPage
    participant ContentSvc as LearnerCourseContentService
    participant ProgressEp as LessonProgress endpoint/service
    participant DB as Enrollment persistence

    Learner->>Detail: View public course detail
    Learner->>Detail: Click "Enroll"
    Detail->>EnrollCtrl: POST /api/v1/courses/{courseId}/enroll

    alt Course not PUBLISHED
        EnrollCtrl-->>Detail: 404 Not Found
    else Already enrolled
        EnrollCtrl-->>Detail: 409 Conflict
    else Eligible
        EnrollCtrl->>DB: create Enrollment (status = ACTIVE)
        DB-->>EnrollCtrl: saved enrollment
        EnrollCtrl-->>Detail: 201 EnrollmentResponse (ACTIVE)
    end

    Learner->>Player: Open /dashboard/courses/{courseId}
    Player->>ContentSvc: GET /api/v1/learner/courses/{courseId}/content
    ContentSvc->>DB: check enrollment status for (learner, courseId)

    alt Not enrolled, or enrollment CANCELLED
        ContentSvc-->>Player: 404 Not Found
    else ACTIVE or COMPLETED
        ContentSvc->>DB: load sections, lessons, lesson progress
        DB-->>ContentSvc: content + per-lesson progress
        ContentSvc-->>Player: 200 CourseContentResponse
        Player-->>Learner: render lessons, auto-select first incomplete

        Learner->>Player: Mark a lesson complete
        Player->>ProgressEp: PATCH /api/v1/lessons/{lessonId}/progress
        ProgressEp->>DB: upsert LessonProgress (isCompleted = true)
        ProgressEp->>DB: recalculate Enrollment.progressPercentage
        Note over ProgressEp,DB: if progressPercentage reaches 100, status -> COMPLETED, completedAt set
        DB-->>ProgressEp: updated enrollment + progress
        ProgressEp-->>Player: 200 LessonProgressResponse
        Player-->>Learner: optimistic UI update (rollback on error)
    end
```

**Notes:**
- **Enrollment-gated access** — `GET /api/v1/learner/courses/{courseId}/content`,
  `PATCH /api/v1/lessons/{lessonId}/progress`, and
  `GET /api/v1/lessons/course/{courseId}/progress` all require an ACTIVE or
  COMPLETED enrollment. A learner who is **not enrolled, or whose enrollment
  is CANCELLED, receives 404 — not 403** — so that course existence cannot be
  enumerated by id.
- **Progress sync** — `progressPercentage` on `Enrollment` is not stored
  independently; it is recalculated from the count of completed
  `LessonProgress` rows in the same transaction as the lesson-progress
  update, and the enrollment status flips to `COMPLETED` automatically when
  it reaches 100%. Dashboard and progress pages read this rolled-up value
  rather than recomputing it themselves.
- The course player's lesson content area itself (video/body) is a
  placeholder panel — this diagram covers progress tracking only, not
  content rendering.

---

## 3. Learner Quiz Attempt and Scoring

```mermaid
sequenceDiagram
    actor Learner
    participant Quizzes as CoursePlayerPage Quizzes tab
    participant QuizCtrl as LearnerQuizController
    participant QuizSvc as LearnerQuizService
    participant QDB as Quiz/Question/AnswerOption persistence
    participant ADB as QuizAttempt persistence

    Learner->>Quizzes: Open Quizzes tab
    Quizzes->>QuizCtrl: GET /api/v1/learner/courses/{courseId}/quizzes
    QuizCtrl->>QuizSvc: listPublishedQuizzes
    QuizSvc->>QDB: check enrollment, filter status = PUBLISHED

    alt Not enrolled
        QuizSvc-->>Quizzes: 404 Not Found
    else Enrolled
        QDB-->>QuizSvc: published quizzes
        QuizSvc-->>Quizzes: 200 quiz summaries
        Learner->>Quizzes: Start quiz attempt
        Quizzes->>QuizCtrl: POST /api/v1/learner/quizzes/{quizId}/attempts
        QuizCtrl->>QuizSvc: startOrResumeAttempt

        alt Quiz DRAFT/ARCHIVED, or not enrolled in its course
            QuizSvc-->>Quizzes: 404 Not Found
        else Quiz PUBLISHED and enrolled
            QuizSvc->>ADB: find existing IN_PROGRESS attempt
            alt Existing IN_PROGRESS attempt found
                ADB-->>QuizSvc: existing attempt
            else No existing attempt
                QuizSvc->>ADB: create attempt (status = IN_PROGRESS)
                ADB-->>QuizSvc: new attempt
            end
            QuizSvc-->>Quizzes: 200 QuizAttemptResponse (IN_PROGRESS)

            Quizzes->>QuizCtrl: GET /api/v1/learner/quizzes/{quizId}
            QuizCtrl->>QuizSvc: getQuizForTaking
            QuizSvc->>QDB: load questions + answer options
            QDB-->>QuizSvc: questions/options (no isCorrect field)
            QuizSvc-->>Quizzes: 200 quiz detail without correctness
            Quizzes-->>Learner: render one-option-per-question radio form

            Learner->>Quizzes: Select answers, submit
            Quizzes->>QuizCtrl: POST /api/v1/learner/quiz-attempts/{attemptId}/submit

            alt Attempt already SUBMITTED
                QuizSvc-->>Quizzes: 409 Conflict
                Quizzes->>QuizCtrl: GET /api/v1/learner/quiz-attempts/{attemptId}
                QuizCtrl-->>Quizzes: 200 existing stored result
            else Duplicate answer, missing question, or option not owned by question
                QuizSvc-->>Quizzes: 400 Bad Request
            else Valid submission
                QuizSvc->>QDB: verify each option belongs to its question
                QuizSvc->>QuizSvc: earnedPoints, totalPoints, scorePercentage = floor(earned*100/total)
                QuizSvc->>QuizSvc: passed = scorePercentage >= quiz.passingScore
                QuizSvc->>ADB: save QuizAttempt (SUBMITTED) and QuizAttemptAnswer rows
                ADB-->>QuizSvc: persisted
                QuizSvc-->>Quizzes: 200 QuizAttemptResponse (score, passed, per-question correctness)
                Quizzes-->>Learner: show score, passed/not-passed badge, per-question feedback
            end
        end
    end
```

**Notes:**
- **Correct answer secrecy** — the learner-facing quiz detail
  (`LearnerAnswerOptionResponse`) never includes an `isCorrect` field.
  Correctness is computed and revealed only after submission, inside the
  per-question results of `QuizAttemptResponse`.
- **Scoring rule** — `scorePercentage = floor(earnedPoints * 100 /
  totalPoints)`; `passed = scorePercentage >= quiz.passingScore`. A question
  earns its full point value only if the selected option is correct,
  otherwise zero.
- **Access control** — every learner quiz endpoint is enrollment-gated and
  quiz-status-gated: a non-enrolled learner, a DRAFT/ARCHIVED quiz, or a
  mismatched course all resolve to `404` (not `403`), consistent with the
  enumeration-prevention pattern used elsewhere in the API. Resubmitting an
  already-`SUBMITTED` attempt returns `409`, after which the frontend falls
  back to fetching the stored result rather than treating it as an error.
  There is no attempt-history list — only the most recent attempt's result
  is retrievable by id.

---

## 4. Learner Certificate Issuance

```mermaid
sequenceDiagram
    actor Learner
    participant Player as CoursePlayerPage
    participant Panel as CertificatePanel
    participant CertCtrl as CertificateController
    participant CertSvc as CertificateService
    participant DB as Certificate/Enrollment persistence

    Learner->>Player: Complete all lessons (progressPercentage = 100)
    Player->>Panel: Render certificate panel
    Panel->>CertCtrl: GET /api/v1/learner/certificates
    CertCtrl->>DB: list certificates for caller
    DB-->>CertCtrl: certificates
    CertCtrl-->>Panel: 200 list

    alt Certificate already exists for this course
        Panel-->>Learner: show "View certificate" link
    else No certificate yet
        Panel-->>Learner: show "Issue certificate" button
        Learner->>Panel: Click "Issue certificate"
        Panel->>CertCtrl: POST /api/v1/learner/certificates/course/{courseId}/issue
        CertCtrl->>CertSvc: issueCertificateForCourse

        alt Enrollment not COMPLETED
            CertSvc-->>Panel: 409 Conflict
            Panel-->>Learner: accessible role="alert" error message
        else Certificate already issued (idempotent repeat)
            CertSvc->>DB: find existing certificate
            DB-->>CertSvc: existing certificate
            CertSvc-->>Panel: 200 CertificateResponse (existing)
            Panel-->>Learner: show "View certificate" link
        else First issuance, enrollment COMPLETED
            CertSvc->>DB: create Certificate (certificateCode, issuedAt)
            DB-->>CertSvc: saved certificate
            CertSvc-->>Panel: 201 CertificateResponse (new)
            Panel-->>Learner: show "View certificate" link
        end
    end

    Learner->>Panel: Click "View certificate"
    Panel->>CertCtrl: GET /api/v1/learner/certificates/{certificateId}
    CertCtrl->>DB: find by id, verify ownership
    alt Not found or not owned by caller
        CertCtrl-->>Panel: 404 Not Found
    else Found and owned
        DB-->>CertCtrl: certificate
        CertCtrl-->>Panel: 200 CertificateResponse
        Panel-->>Learner: render full-screen certificate document (Print / Save as PDF)
    end
```

**Notes:**
- **Manual trigger, not automatic** — reaching 100% progress only makes the
  certificate panel appear; the `POST .../issue` call happens only on an
  explicit learner click. Nothing issues a certificate as a side effect of
  the lesson-progress endpoint itself.
- **Idempotent issuance** — a repeat `POST .../issue` call for a course that
  already has a certificate returns `200` with the existing certificate
  rather than creating a duplicate or erroring.
- **Completion gate** — `CertificateService` rejects issuance with `409` if
  the caller's enrollment for the course is not `COMPLETED`; the frontend
  surfaces this as an accessible (`role="alert"`) message in the panel
  rather than a silent failure.
- **No PDF generation** — the certificate view renders an HTML document and
  relies on the browser's native print dialog (`window.print()`) for a PDF;
  there is no server-side rendering, email delivery, or sharing endpoint.

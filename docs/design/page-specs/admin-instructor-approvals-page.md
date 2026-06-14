# Admin Instructor Approvals Page UI Layout Specification

## 0. Scope and Assumptions

This is a no-implementation UI and interaction specification for the **admin instructor approvals page**: the first admin-facing product surface in Learnova. It is the workspace where an internal admin reviews instructor access requests submitted by learners and approves or rejects each one.

**This is product/admin UI, not marketing UI.** It is not a public catalog, not a marketplace, and not a metrics dashboard. Per `PRODUCT.md`, admins are "internal operators managing instructor approvals and platform health. Utility-first; they optimize for batch actions, not aesthetics." The page must feel like a restrained administrative review workspace: calm, clear, and safe to act in. Its single job is to make pending requests reviewable and to make the approve and reject decisions obvious and low-risk.

**In scope for v1:**

- Listing the instructor profile requests currently awaiting review (`PENDING` only, see §2).
- Showing each request's applicant identity and submitted application details.
- Approving a request against the existing backend approve endpoint.
- Rejecting a request against the existing backend reject endpoint, which requires a reason.
- Loading, empty, and error states.
- Row-level action feedback (in-flight, success, inline error).

**Out of scope for v1 (do not build, do not imply in the UI):**

- Full user management (creating, editing, suspending, or deleting users).
- Course moderation or content review.
- Audit logs or admin activity history.
- Admin analytics, platform health metrics, or dashboards.
- Revoking a previously granted instructor approval (no backend path exists, see §10).
- An approval history view of already approved or rejected applications (no admin list endpoint returns these, see §2 and §10).
- Server-side search, filtering, sorting, or pagination (no such parameters exist on the backend).
- Bulk or batch approve/reject (the endpoints are per-profile only).

**Access assumption.** This page is **admin-only** and must sit behind `AdminRoute`. `AdminRoute` already exists (`frontend/src/components/common/AdminRoute.tsx`) and checks `isAuthenticated` plus `user.roles.includes('ROLE_ADMIN')`, redirecting unauthenticated users to `/login` and authenticated-but-not-admin users to `/unauthorized`. The backend `roles` array from `GET /api/v1/auth/me` is the single source of truth for admin access. Do not infer admin access from `activeProfile` or from stale localStorage.

**Note on the dual-profile model.** Admin is a **role** (`ROLE_ADMIN` in `user.roles`), not a switchable **profile**. `ProfileType` is only `'LEARNER' | 'INSTRUCTOR'`; there is no `'ADMIN'` profile. So admin access is gated by the role array, which is exactly what `AdminRoute` checks. This page does not interact with `activeProfile` at all.

---

## 1. Route and Access

**Recommended route: `/admin/instructor-approvals`.**

Register it as a child of the pathless `RootLayout` in `frontend/src/router/index.tsx`, as a sibling of `/dashboard` and `/instructor`, wrapped in `AdminRoute`. It is **not** a child of the learner `/dashboard` tree and **not** a child of the `/instructor` tree, because both of those shells are scoped to their respective non-admin audiences. Nesting an admin surface under either would conflate roles.

```tsx
// Conceptual placement in src/router/index.tsx (do not implement in this task)
{
  path: '/admin/instructor-approvals',
  element: (
    <AdminRoute>
      <Suspense fallback={<DashboardPageSkeleton />}>
        <AdminInstructorApprovalsPage />
      </Suspense>
    </AdminRoute>
  ),
}
```

**Guard: `AdminRoute`.** Redirect behavior is already owned by the guard:

- Not authenticated, redirect to `/login`.
- Authenticated but `roles` does not include `'ROLE_ADMIN'`, redirect to `/unauthorized`.

Do not duplicate this authorization logic inside the page. The page may assume that if it renders, the viewer is an admin.

**Unauthenticated and non-admin behavior** are both handled entirely by `AdminRoute`. The page does not render a "you are not allowed" message itself; it never mounts for a non-admin.

**Navigation placement.** Do **not** add admin links to the learner `DashboardLayout` sidebar or the instructor topbar. The learner sidebar (`NAV_ITEMS` in `frontend/src/features/dashboard/components/DashboardLayout.tsx`) is a fixed learner list, and the instructor topbar is teaching-scoped. Admin is a distinct operator context. How the admin area is shelled is an open decision (§10); the v1 default is in §4.

**Shell recommendation (v1 default).** Start with a **lightweight admin shell or a page-level layout**, not the learner dashboard sidebar and not the instructor topbar verbatim. There is no `AdminLayout` today. Two acceptable v1 options, in order of preference:

1. **Minimal `AdminLayout`** modeled on `InstructorLayout` (`frontend/src/features/instructor/components/InstructorLayout.tsx`): a thin topbar with the Learnova logo, an "Admin" context label (the bordered-pill pattern `InstructorLayout` uses for "Teaching"), a back link to `/dashboard`, the skip-to-content link, and a scrollable `<main id="main-content" tabIndex={-1}>`. This is the cleanest path and keeps the admin context visually distinct.
2. **Standalone page** using the dashboard product shell `<div>` (see §4) with a back link to the learner dashboard, introducing `AdminLayout` as a fast follow.

Either way, the learner sidebar and instructor topbar must not gain admin items. Whether to build `AdminLayout` now is formally an open decision (§10), with option 1 recommended.

---

## 2. Backend Contract

All paths, methods, request bodies, and response shapes below are verified by reading `AdminInstructorProfileController.java`, `InstructorProfileService.java`, `InstructorProfileResponse.java`, `InstructorProfileRejectionRequest.java`, and `InstructorApprovalStatus.java`.

| Method | Path | Purpose | Auth | Request body | Response | Verified |
|---|---|---|---|---|---|---|
| GET | `/api/v1/admin/instructor-profiles/pending` | List instructor requests awaiting review | `ADMIN` (`@PreAuthorize("hasRole('ADMIN')")`) | none | `200` with `List<InstructorProfileResponse>` | Yes |
| POST | `/api/v1/admin/instructor-profiles/{profileId}/approve` | Approve a request, grant `ROLE_INSTRUCTOR` | `ADMIN` | none | `200` with the updated `InstructorProfileResponse` | Yes |
| POST | `/api/v1/admin/instructor-profiles/{profileId}/reject` | Reject a request with a reason | `ADMIN` | `InstructorProfileRejectionRequest` (required) | `200` with the updated `InstructorProfileResponse` | Yes |

**The reject endpoint exists.** This is confirmed in `AdminInstructorProfileController.rejectInstructorProfile`. Reject is **not** a blocker. The reject request body is required and validated:

```json
{ "rejectionReason": "string" }
```

`InstructorProfileRejectionRequest` constraints (verified):

- `rejectionReason` is `@NotBlank` ("Rejection reason is required"). A reason is **mandatory**; the UI cannot submit a reject without one.
- `rejectionReason` is `@Size(max = 1000)` ("Rejection reason must not exceed 1000 characters").

The service trims the reason before persisting.

**Pending list returns only `PENDING`.** Verified in `InstructorProfileService.getPendingInstructorProfiles()`: it calls `findByApprovalStatus(InstructorApprovalStatus.PENDING)`. Consequences:

- The list at the center of this page contains pending requests only. After approve or reject, the affected request is no longer `PENDING` and would not appear in a subsequent fetch of this endpoint.
- There is **no admin endpoint that returns approved or rejected history.** `GET /api/v1/instructor-profile/me` exists but returns only the *calling* user's own profile, which is useless to an admin reviewing other people. So an "approval history" tab cannot be built against real data in v1 (see §10). Do not invent a history list.

**Approve behavior (verified, affects UI assumptions).** `approveInstructorProfile`:

- Is **idempotent for already-approved profiles**: if `approvalStatus == APPROVED`, it returns the profile unchanged. A double-approve does not error.
- On a fresh approve: sets `approvalStatus = APPROVED`, clears `rejectionReason` to `null`, sets `reviewedAt = now`, and grants `ROLE_INSTRUCTOR` to the user.
- Returns `404` ("Instructor profile request not found") if `profileId` does not exist.

**Reject behavior (verified, affects UI assumptions).** `rejectInstructorProfile`:

- Sets `approvalStatus = REJECTED`, sets `rejectionReason` (trimmed), sets `reviewedAt = now`. There is no guard against re-rejecting; it applies the change regardless of the current status.
- Returns `404` ("Instructor profile request not found") if `profileId` does not exist.
- Returns `400` (Bean Validation) if `rejectionReason` is blank or exceeds 1000 characters.

**Auth failures.** A non-admin token reaching these endpoints yields `403`; a missing or invalid token yields `401`. The frontend does not handle these here; the shared Axios response interceptor owns them (`401` logout and redirect to `/login`, `403` redirect to `/unauthorized`). `AdminRoute` also prevents a non-admin from ever mounting the page.

**No frontend admin client exists yet.** `CURRENT_STATE.md` lists "admin instructor approval" under missing API clients. A new client module (suggested `src/api/adminInstructorProfiles.ts`) must be added when this page is implemented, using the shared Axios instance (`src/api/axios.ts`). Never import raw axios in feature code.

---

## 3. State Model

The UI item model mirrors the real `InstructorProfileResponse` record field for field. `Instant` serializes to an ISO string. Do not invent fields, and do not assume `createdAt` / `updatedAt`: the real timestamp fields are `requestedAt` and `reviewedAt`.

```ts
// Mirrors backend InstructorApprovalStatus enum.
type InstructorApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// Mirrors backend InstructorProfileResponse record field for field.
type InstructorProfileReviewItem = {
  id: number;                            // instructor profile id (the {profileId} path variable)
  userId: number;
  fullName: string;                      // from the linked User
  email: string;                         // from the linked User
  bio: string;                           // required at creation; non-null in practice
  expertise: string;                     // required at creation; non-null in practice
  experience: string | null;             // optional field, may be null
  motivation: string | null;             // optional field, may be null
  approvalStatus: InstructorApprovalStatus;
  rejectionReason: string | null;        // null for pending and approved
  requestedAt: string;                   // ISO instant
  reviewedAt: string | null;             // null until reviewed
};
```

Notes grounded in source:

- `bio` and `expertise` are required when a learner submits a request (`InstructorProfileService.requestInstructorProfile` trims them from a validated request), so for pending items they will be present. Still treat them defensively in display (see §5).
- `experience` and `motivation` are normalized to `null` when blank, so they are genuinely optional and must be conditionally rendered.
- For pending items, `approvalStatus` is always `'PENDING'`, `rejectionReason` is `null`, and `reviewedAt` is `null`. The fields are typed for completeness and for the optimistic post-action shape returned by approve/reject.

**Local UI state managed inside the page:**

```ts
type AdminApprovalsLocalState = {
  isLoading: boolean;                    // true while the pending-list fetch is in flight
  loadError: string | null;             // set when the list fetch fails
  requests: InstructorProfileReviewItem[]; // the fetched pending list
  actionPendingId: number | null;       // profile id whose approve/reject is in flight (one at a time)
  actionErrorById: Record<number, string>; // row-level action error keyed by profile id
  rejectingId: number | null;           // profile id whose reject reason input is open (see §6)
};
```

Design intent of this shape:

- `actionPendingId` is a single id, not a set, because a calm admin workflow reviews one request at a time. It drives the `loading` state on the pressed button and disables that row's sibling action. It does not block the whole list.
- `actionErrorById` keeps errors row-scoped so one failed action never replaces the page with a global red banner.
- `rejectingId` tracks which row has its reject reason field expanded (the reject flow is two-step because a reason is mandatory, see §6).
- An optional client-side filter is **not** included in v1 because the list is single-status (`PENDING`). A filter only becomes meaningful if a multi-status admin list endpoint is added (§10).

---

## 4. Layout and Structure

**Page shell (v1 default).** Reuse the canonical dashboard product page shell so the admin surface stays visually continuous with the rest of the app:

```tsx
<div className="px-8 py-8 pb-14 max-w-container mx-auto">
```

This is the identical shell used by `MyCoursesPage`, `SettingsPage`, and `InstructorCoursesPage`. Do **not** use the marketing `Container` primitive, `SectionHeader`, `Stat`, or any full-width marketing `<section>` band.

**Surrounding chrome.** Render the shell inside the lightweight admin shell described in §1 (recommended), or standalone with a back link as the fallback. The learner sidebar and instructor topbar must not be reused or extended.

Top-to-bottom content structure inside the shell:

1. **Page header** (§4.1): H1 and subtitle.
2. **Summary strip** (§4.2): a compact inline count line. Not a metric grid, not `Stat`.
3. **Pending approvals list** (§5): one row per pending request, or the empty/error state.

### 4.1 Page header

- **H1**: "Instructor approvals" -> `text-title font-semibold text-text-primary`.
- **Subtitle**: "Review instructor access requests and manage approval decisions." -> `text-body-sm text-text-secondary mt-1`.

Header block spacing: `mb-8`.

There is **no primary action in the header.** Unlike the instructor courses page (which has "Create course"), this page has nothing to create at the page level. The meaningful actions live per row. This keeps the page honest and quiet.

### 4.2 Summary strip

A single inline line beneath the header, `text-body-sm text-text-secondary mb-8`, with the count value emphasized `font-semibold text-text-primary`:

```
3 pending requests
```

Rules:

- Use inline text, **not** a metric grid and **not** the `Stat` primitive.
- The count is computed client-side from `requests.length` (the full fetched pending list).
- Singular and plural: "1 pending request" vs "3 pending requests".
- When the list is empty, omit the summary strip entirely; the empty state (§7) carries the message instead.

### 4.3 Content-column wireframe (lg breakpoint)

```
 px-8 py-8 pb-14 max-w-container mx-auto   (inside admin shell)
┌──────────────────────────────────────────────────────────────────────────┐
│ Instructor approvals                          (h1 · text-title · semibold) │
│ Review instructor access requests and manage approval decisions.           │
│                                                              (mb-8)         │
│ 3 pending requests                            (summary strip · body-sm)     │
│                                                              (mb-8)         │
│ ┌────────────────────────────────────────────────────────────────────┐    │
│ │ Sara Malik                                          [PENDING]       │    │
│ │ sara.malik@example.com · Requested 2 days ago                       │    │
│ │                                                                     │    │
│ │ Expertise: Frontend engineering                                     │    │
│ │ Bio: Ten years building design systems for fintech teams.           │    │
│ │ Experience: Led UI at two startups.        (only if present)        │    │
│ │ Motivation: I want to mentor career changers. (only if present)     │    │
│ │                                                                     │    │
│ │                                      [ Approve ]   [ Reject ]        │    │
│ └────────────────────────────────────────────────────────────────────┘    │
│ ┌────────────────────────────────────────────────────────────────────┐    │
│ │ Devon Price                                         [PENDING]       │    │
│ │ devon.price@example.com · Requested 5 hours ago                     │    │
│ │ ...                                                                 │    │
│ └────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
```

### 4.4 Responsive behavior

| Breakpoint | Shell max-width | Row layout | Notable |
|---|---|---|---|
| base (< 640px) | `max-w-container` | identity and badge stack; details stack; action buttons go full-width or wrap below details | reject reason field (§6) spans full width |
| `sm` (640px) | `max-w-container` | actions sit inline, right-aligned below the details | |
| `md` (768px+) | `max-w-container` | full row: name + badge on the top line, details block, actions right-aligned on the action row | |

Horizontal padding stays a flat `px-8` to match the established shells. The `px-4 sm:px-8` mobile tightening seen on `ProgressPage` is the same optional refinement flagged in the other specs; do not decide it here.

### 4.5 Vertical rhythm

- Header block: `mb-8`. Summary strip: `mb-8`.
- Request rows: `gap-3` between rows (`flex flex-col gap-3` or `space-y-3`).
- Inside a row: `p-4`; name line to meta `mb-1`; meta to details block `mb-3`; details block to action row `mb-3` (when actions wrap below on mobile). The reject reason field, when open, sits between the details and the action row with `mt-3`.

---

## 5. Approval List Specification

Prefer a **list of full-width rows**, not public-catalog cards. The public catalog card (`CourseCatalogCard`) is a learner merchandising surface; this is an operator review surface where applicant identity, application content, and the two decision actions matter. Share tokens, not the catalog card component.

**Each request row shows:**

- **Applicant name** -> `fullName`, `text-body-sm font-semibold text-text-primary`, `line-clamp-1`. If `fullName` is somehow empty, fall back to `email`.
- **Status badge** -> the `Badge` primitive, text-labeled "Pending" (§5.1). For the pending list this is always Pending; status is communicated by badge *text*, never by color alone.
- **Email and request date** -> a single quiet meta line, dot-separated, `text-caption text-text-secondary`: `sara.malik@example.com · Requested 2 days ago`. The date derives from `requestedAt`. If a shared relative-time utility is not available, render a short absolute date; do not invent a new format token.
- **Application details** -> a small labeled block (§5.2) showing `expertise`, `bio`, and, only when present, `experience` and `motivation`.
- **Action area** -> per §6, right-aligned on the action row at `sm+`, wrapping below the details on mobile.

### 5.1 Status badge mapping

The `Badge` primitive renders text uppercase with letter-spacing, so the labels below appear uppercase on screen. This mapping is consistent with the instructor approval badge mapping already defined in the Settings page spec.

| `approvalStatus` | Badge variant | Rendered label | Rationale |
|---|---|---|---|
| `PENDING` | `default` | Pending | Neutral surface tint; awaiting a decision, not a status to celebrate or warn about. |
| `APPROVED` | `salem` | Approved | Salem is the active/granted meaning, reserved and earned. Appears only on the transient post-approve row state (§6), not in the steady pending list. |
| `REJECTED` | `coral` | Rejected | Coral is a status-bearing attention color; appears only on the transient post-reject row state (§6). |

In the steady v1 pending list, every row shows the `Pending` (`default`) badge. The `salem` and `coral` mappings are specified for the optional brief post-action confirmation state in §6, and for any future history view (§10).

### 5.2 Application details block

A compact labeled block inside the row, below the meta line. Use a definition-list idiom for correct semantics:

```tsx
<dl className="mt-3 space-y-1.5">
  <div>
    <dt className="text-caption font-medium text-text-primary">Expertise</dt>
    <dd className="text-body-sm text-text-secondary">{item.expertise}</dd>
  </div>
  <div>
    <dt className="text-caption font-medium text-text-primary">Bio</dt>
    <dd className="text-body-sm text-text-secondary">{item.bio}</dd>
  </div>
  {/* Render only when present: */}
  {item.experience && (
    <div>
      <dt className="text-caption font-medium text-text-primary">Experience</dt>
      <dd className="text-body-sm text-text-secondary">{item.experience}</dd>
    </div>
  )}
  {item.motivation && (
    <div>
      <dt className="text-caption font-medium text-text-primary">Motivation</dt>
      <dd className="text-body-sm text-text-secondary">{item.motivation}</dd>
    </div>
  )}
</dl>
```

- `experience` and `motivation` rows must be omitted entirely when their value is `null`. Do not render an empty label.
- Long bios can wrap freely; cap readable width within the row at the body max-width rhythm (text already sits inside the constrained content column). Do not truncate the bio, the admin needs to read it to decide. If a row becomes very tall, that is acceptable for a review surface.

### 5.3 Row surface tokens

| Property | Token |
|---|---|
| Background | `bg-surface` |
| Border | `border border-border-default` |
| Radius | `rounded-lg` |
| Padding | `p-4` |
| Shadow at rest | none (Flat-At-Rest Rule) |
| Hover | none (the row is not a single clickable target; it contains multiple actions) |

Do not use a public catalog card, a thumbnail, or any merchandising element. There is no course, price, rating, or image here, only a person and their application.

---

## 6. Action Behavior

The page exposes exactly two per-row actions, both verified against real endpoints (§2): **Approve** and **Reject**. There is no page-level primary action.

To respect the Forest Rule (one Salem-weight action per view zone), Salem is reserved for the **Approve** action, which is the primary affirmative decision of this workspace. Reject uses the existing destructive variant. No grid of Salem buttons appears.

### 6.1 Approve

- **Control**: `Button variant="primary" size="sm"`, label "Approve". This is the page's single Salem-weight action per row, and it is the affirmative path, so the Salem fill is earned here.
- **aria-label**: includes the applicant identifier, for example `Approve instructor request from Sara Malik`.
- **Call**: `POST /api/v1/admin/instructor-profiles/{id}/approve` (no body), where `{id}` is `item.id`.
- **In-flight**: set `actionPendingId = item.id` and pass `loading` to this button (spinner, disabled, `aria-busy`, already built into `Button`). Disable the row's Reject button while approve is in flight. Do not block the rest of the list.
- **On success**: the backend returns the updated `InstructorProfileResponse` with `approvalStatus = 'APPROVED'`. Because the page lists pending requests only, the approved item no longer belongs here. Two acceptable patterns:
  - **Preferred**: optimistically remove the row from `requests` and decrement the summary count. Optionally show a brief, calm, transient confirmation in place of the row (for example a one-line "Approved Sara Malik." `text-body-sm text-text-secondary` that fades or is replaced on next render). Keep it quiet; no celebratory animation, no Anzac, no trophy.
  - **Acceptable**: refetch the pending list. Simpler, slightly heavier. Do not do a full-page reload.
- Do not navigate away on success.

### 6.2 Reject

Reject is a meaningful, hard-to-reverse decision and the backend **requires a reason**, so the flow is two-step and includes confirmation by construction (the admin must type something before it can be sent).

- **Trigger control**: `Button variant="destructive" size="sm"`, label "Reject". `aria-label` includes the applicant identifier, for example `Reject instructor request from Sara Malik`.
- **Step 1, open the reason field**: clicking "Reject" sets `rejectingId = item.id`, which reveals an inline reason field within that row (not a separate page, not a heavy modal). Use the `Input`/textarea token pattern from the design system (`bg-surface`, `1px border-border-default`, `8px` radius, `text-body` for content). A textarea is appropriate because the reason can be up to 1000 characters.
  - Field label: a visible `text-caption font-medium text-text-primary` label, for example "Reason for rejection (required)".
  - Helper line: `text-caption text-text-muted`, "The applicant may see this reason. Maximum 1000 characters."
  - The field is associated with its label via `htmlFor`/`id`, and gains focus when revealed.
- **Step 2, confirm and submit**: within the revealed area, show a confirm button `Button variant="destructive" size="sm"`, label "Confirm rejection", and a `Button variant="ghost" size="sm"`, label "Cancel". The confirm text itself is the destructive confirmation copy (no separate dialog system required).
  - Client-side guard: the confirm button is `disabled` while the reason is blank or exceeds 1000 characters, mirroring `@NotBlank` and `@Size(max=1000)`. Surface a `text-caption` count or limit hint near the field.
  - **Call**: `POST /api/v1/admin/instructor-profiles/{id}/reject` with body `{ rejectionReason: <trimmed value> }`.
  - **In-flight**: set `actionPendingId = item.id`, pass `loading` to the confirm button, disable Cancel and the reason field.
  - **On success**: backend returns the updated profile with `approvalStatus = 'REJECTED'`. As with approve, remove the row from the pending list (preferred) or refetch. Optionally show a brief, calm "Rejected Sara Malik." confirmation. No red takeover.
- **Cancel**: clears `rejectingId` and the typed reason, returning the row to its resting two-button state. Cancel performs no network call.

### 6.3 Why no fake or missing actions

- The Reject action is shown because the backend supports it (§2). It is not a placeholder.
- No "revoke approval", "restore", or "re-review" action is shown, because no backend endpoint supports those in v1 (§10).
- No bulk approve/reject is shown, because the endpoints are per-profile only.

### 6.4 Action errors

Action errors are **row-level and inline**, never a page-level red banner (the page is not blocked, only one action failed):

- Store the message in `actionErrorById[item.id]` and render it within the row as `text-caption text-error mt-2` with `role="alert"`.
- **Approve 404** (request vanished between load and action, for example already actioned by another admin): inline line "This request is no longer available." Remove the row or refetch; disable its actions.
- **Reject 404**: same handling as approve 404.
- **Reject 400** (blank or too-long reason that slipped past the client guard): inline line "Enter a rejection reason of 1000 characters or fewer." Keep the reason field open so the admin can correct it.
- **Network or 5xx**: inline line "Something went wrong. Try again." The pressed button returns to idle; the row stays actionable.
- **401 / 403**: do not handle manually. The shared Axios response interceptor owns these (`401` logout and `/login`, `403` `/unauthorized`). `AdminRoute` also prevents a non-admin from mounting the page.

Clear the row error when the admin retries successfully.

---

## 7. Loading, Empty, and Error States

These page-level states are mutually exclusive with the loaded list.

**Loading.** A skeleton list in the established `Bone` idiom (matching `DashboardPageSkeleton`): a header bone pair (`h-7 w-48`, then `h-4 w-72`), then three to five row skeletons, each `rounded-lg border border-border-default bg-surface p-4` containing a name bone, a meta bone, two detail bones, and a trailing action bone. Wrap the skeleton in `aria-hidden="true"`. No page-level spinner; spinners are reserved for in-button loading (`Button loading`).

**Empty (no pending requests).** Use the `StatePanel` idiom (`frontend/src/components/dashboard/StatePanel.tsx`), a calm bordered panel:

- Title: "No pending instructor requests" -> rendered via `StatePanel`'s `title` prop (`text-body-sm font-medium text-text-primary`).
- Body: "New instructor applications will appear here when learners apply." -> `StatePanel`'s `message` prop (`text-body-sm text-text-secondary`).
- No action button. There is nothing to retry on an intentional empty, and nothing to create. (`StatePanel` renders the "Try again" affordance only when `onRetry` is passed, so simply omit `onRetry`.)

This empty state is the expected resting state of a healthy queue, so it must read as calm and complete, not as an error.

**Error (pending-list fetch failed).** Use `StatePanel` with:

- `message`: "We could not load instructor requests."
- `onRetry`: wired to re-run the fetch. `StatePanel` renders a "Try again" text action when `onRetry` is provided.

Calm bordered panel, secondary ink, no red, no illustration. Do not also render the summary strip in the error state.

**401 / 403 on the list fetch.** Not handled here. The Axios interceptor redirects; `AdminRoute` guards mount.

---

## 8. Accessibility

- **Semantic heading order**: the page H1 is "Instructor approvals". If the list is given a grouping heading it is an `h2`; do not skip levels. Applicant names in rows are not headings (they are `font-semibold` text, or a `dt`-like label), so they do not introduce heading levels. If a row name is promoted to a heading later, use a consistent level (for example `h2` per row) and keep it consistent.
- **Per-request accessible label**: each row should be a list item with a clear accessible name. Use a list structure (`<ul>` of `<li>`, or `role="list"`/`role="listitem"`), and give each row an `aria-label` or an `aria-labelledby` pointing at the applicant name element, for example "Instructor request from Sara Malik".
- **Action labels include the applicant identifier**: every Approve and Reject button carries an `aria-label` naming the applicant, because a list of buttons all labeled "Approve" fails screen-reader users. Examples: `aria-label="Approve instructor request from Sara Malik"`, `aria-label="Reject instructor request from Sara Malik"`, and for the reject confirm step `aria-label="Confirm rejection of Sara Malik"`.
- **Status as text, not color alone**: the status badge conveys "Pending" / "Approved" / "Rejected" as visible text. Never rely on the badge tint alone (PRODUCT.md and the Field Rule).
- **Destructive confirmation is visible text**: the reject flow shows a visible "Confirm rejection" control and a visible required-reason field; the destructive intent is communicated in words, not by color alone.
- **Reason field semantics**: the reject reason field has a visible `<label>` associated by `htmlFor`/`id`. The character-limit helper is linked via `aria-describedby`. The field receives focus when the reject flow opens.
- **Row errors use `role="alert"`**: inline action errors announce on appearance without requiring focus movement.
- **Async outcomes**: the per-row result region (success confirmation or inline error) should be a polite live region (`aria-live="polite"`); the page-level error panel should be discoverable on load (`role="status"` or equivalent). `Button` already announces its own loading state.
- **Focus states**: the shared primitives ship `focus-visible` Salem outlines; do not strip them. All interactive controls keep the established `min-h-[44px]` hit area (already enforced by `Button` sizes).
- **No nested interactive elements**: the row is not itself a button or link wrapping the action buttons. Approve, Reject, and the reject-flow controls are siblings within the row, not nested inside a clickable container.
- **Keyboard navigation**: all controls are reachable by Tab in a logical order (Approve, then Reject, then, when open, the reason field and its Confirm/Cancel). No focus traps. The reveal-on-reject interaction must keep focus management sane (move focus into the reason field on open, return focus to a sensible control on cancel).
- **Reduced motion**: route any transition (row removal, confirmation fade) through `motion-safe:`, honoring `prefers-reduced-motion`. Entrance and exit effects must degrade to instant.

---

## 9. Design-Rule Compliance Notes

- **Admin product workspace, not marketing**: the page uses the dashboard product shell (`px-8 py-8 pb-14 max-w-container mx-auto`), the product-register `text-title` header, and quiet typography. It deliberately avoids `Container`, `SectionHeader`, and `Stat`, keeping it on the app side of the register boundary.
- **No marketplace visuals**: no price, rating, discount, "best seller", enrollment-count, thumbnail, or urgency element appears anywhere. The row template has no slot for them.
- **No hero metrics**: the summary strip is a single inline count line, not a `Stat` and not a big-number/gradient-accent metric grid (the named SaaS anti-pattern). No value renders at `text-headline` or `text-display`.
- **No decorative achievement visuals**: approving an instructor is an operational decision, not a gamified reward. No Anzac, no trophy, no XP, no leaderboard, no celebratory animation. The approve confirmation is a quiet line of text.
- **No card shadows at rest**: rows and panels use `border border-border-default` on `bg-surface` with no `shadow-*` at rest (Flat-At-Rest Rule). No hover-lift, because rows are multi-action, not single clickable targets.
- **Salem used sparingly, for the main approval action only**: Salem appears as the Approve button fill, the Approved badge tint (transient post-action only), and focus rings. There are no Salem backgrounds, no Salem-filled button grids, and no large Salem bands. Well within the 15% surface budget.
- **Destructive rejection uses the existing destructive variant**: Reject and Confirm rejection use `Button variant="destructive"` (the `bg-error` variant that already exists in `Button.tsx`). Error red is confined to the destructive action and to inline error text; it is not used as ambient decoration.
- **The Field Rule**: Coral appears only on the (transient) Rejected status badge, a status-bearing context. Anzac does not appear on this page. Neither is used decoratively.
- **No prohibited patterns**: no gradient text, no glassmorphism, no large Salem backgrounds, no accent stripes greater than 1px, no dense Moodle-style enterprise tables.
- **Single typeface, restrained scale**: Inter only; the page steps `text-title` (h1) to `text-body-sm` (names, body, details) to `text-caption` (meta, labels, helpers), with no display sizes borrowed from marketing.
- **Three-tier depth max**: `bg-bg-base` (page) to `bg-surface` (rows, panels, inputs) to `bg-surface-elevated` (badge tint, any hover). Nothing nests deeper.
- **No em dashes in copy**: all prose and UI strings use commas, colons, semicolons, or periods.
- **Professional utility tone**: headings and labels are functional nouns; copy is direct and informative. No motivational language, no urgency theater.

---

## 10. Open Decisions

None of these block writing or implementing the v1 page. Each should be resolved before the relevant behavior ships.

1. **Does the backend have a reject endpoint?** Resolved: **yes.** `POST /api/v1/admin/instructor-profiles/{profileId}/reject` exists and requires a non-blank `rejectionReason` (max 1000 chars). The reject flow in §6 is built against the real endpoint. This is recorded as an open decision in the brief but is answered here: it is **not a blocker**.

2. **Should admin pages get a dedicated `AdminLayout` now?** Recommendation: **yes, a minimal one**, modeled on `InstructorLayout` (logo, "Admin" context pill, back link, skip link, scrollable main). It cleanly separates the admin context from learner and instructor shells and gives future admin pages (user management, moderation) a home. Acceptable fallback for the first slice: render the page standalone with a back link and introduce `AdminLayout` as a fast follow. Either way, do not add admin items to the learner sidebar or instructor topbar.

3. **Should the page show only pending requests or include approval history?** v1 shows **pending only**, because the sole admin list endpoint returns `PENDING` exclusively and there is no endpoint that lists approved or rejected applications. Showing history would require a backend change (for example `GET /api/v1/admin/instructor-profiles?status=...` returning `List<InstructorProfileResponse>` filtered by status, or an all-statuses list). Until that exists, do not fabricate a history tab. If the endpoint is added later, the §3 state model gains a status filter and §5.1's `salem`/`coral` badge mappings come into steady use.

4. **Should approve require confirmation?** v1 recommendation: **no.** Approve is the affirmative, low-harm path, and the backend approve is idempotent for already-approved profiles. A confirmation step would add friction to the common case. (Reject already requires confirmation by construction, because a reason is mandatory.) If the team wants symmetry, a lightweight inline "Confirm approval" step mirroring the reject pattern is acceptable, but it is not recommended for v1.

5. **Should reject require a reason?** Resolved by the backend: **yes, it is mandatory.** `rejectionReason` is `@NotBlank`, max 1000 chars. The §6.2 flow enforces this client-side before submit. The open product question is only whether the reason is later surfaced to the applicant; the backend stores it on the profile, and `GET /api/v1/instructor-profile/me` already returns `rejectionReason`, so a future Settings page enhancement could display it to the rejected learner (see the Settings spec §10.3 on resubmission). Write the reject helper copy assuming the applicant may see the reason.

6. **Should admins be able to revoke instructor approval later?** No backend path exists today: approve grants `ROLE_INSTRUCTOR`, and there is no endpoint to set an approved profile back to pending or rejected, nor to remove the role. Do not build a revoke action in v1. If product needs it, it requires a backend change first.

7. **Should approved instructor users be notified later?** Out of scope for v1; there is no notification system. The approve and reject flows update the profile only. If a notification or email system is added, approve/reject would be natural trigger points. Do not imply a notification is sent in the UI copy.

8. **Concurrent admin edits.** If two admins review the same queue, one may action a request the other still sees. v1 handles this gracefully via the 404 row-error path (§6.4): the stale row shows "This request is no longer available." and is removed or refetched. A real-time queue is out of scope.

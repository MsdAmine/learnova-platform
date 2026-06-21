# Settings Page UI Layout Specification

## 0. Scope and Assumptions

This is a no-implementation visual layout plan for the **learner-dashboard `SettingsPage`** (`frontend/src/features/dashboard/pages/SettingsPage.tsx`). The page renders inside `DashboardLayout`'s `<main>` `<Outlet />`. This spec covers **only the content column**: the topbar, sidebar, and scroll container are owned by `DashboardLayout` and are out of scope.

**Current state.** `SettingsPage.tsx` is fully implemented. Shell class is `className="px-8 py-8 pb-14 max-w-container mx-auto"`. Subtitle is "Manage your account, profile, and learning preferences." Both match the canonical form in §2.2. No stub cleanup required.

**What is already in place.**
- Auth context, JWT token, and user state: `AuthContext.tsx` exposes `user`, `activeProfile`, `logout`, `refreshUser`, and `setActiveProfile` via `useAuth()`.
- `useCurrentUser` (`src/hooks/useCurrentUser.ts`) calls `GET /api/v1/auth/me` on mount and calls `refreshUser()` with the fresh response. It fires automatically when a token is present. It does not return loading state or an error signal; errors are handled by the Axios response interceptor.
- `DashboardLayout` already surfaces the "Become an instructor" CTA (when `instructorApprovalStatus === null`) and a "pending review" note (when `instructorApprovalStatus === 'PENDING'`) with a link to `/dashboard/settings`. The settings page is the **authoritative destination** for full instructor application management.
- The backend endpoint `POST /api/v1/instructor-profile/request` (authenticated) requires a JSON request body. Fields: `bio` (`@NotBlank`, max 1000 chars, required), `expertise` (`@NotBlank`, max 500 chars, required), `experience` (max 1000 chars, optional), `motivation` (max 1000 chars, optional). Returns `InstructorProfileResponse` (not the user DTO). See §5.4 for the form specification.
- The backend supports `GET /api/v1/auth/me` (authenticated). Must be called after a successful `POST /api/v1/instructor-profile/request` to refresh `instructorApprovalStatus` in `AuthContext` and drive the PENDING state transition.

**What does not exist.**
- No user profile update endpoint. Name and email changes are not possible in v1.
- No settings or preference persistence endpoint.
- No password change endpoint.
- No account deletion endpoint.
- No Toggle or Switch component exists in the UI library.

**Design direction.** The settings page is utility-first. It should feel calm, clear, and trustworthy. It is not a marketing page. It does not use hero metrics, gradient text, glassmorphism, large Salem backgrounds, or decorative achievement visuals. Cards carry no shadow at rest. One Salem-weight action per view zone maximum.

---

## 1. Data and State Model

This is a **UI-state model**. It is not a backend contract. Field names and types below reflect the actual `User` interface in `AuthContext.tsx`.

```ts
type ProfileType = 'LEARNER' | 'INSTRUCTOR';

type InstructorApprovalStatus = null | 'PENDING' | 'APPROVED' | 'REJECTED';

// Matches the User interface in AuthContext.tsx exactly.
// Note: id is number (not string). fullName is required (not optional).
type SettingsUser = {
  id: number;
  fullName: string;
  email: string;
  roles: string[];                   // e.g. ['ROLE_LEARNER', 'ROLE_INSTRUCTOR', 'ROLE_ADMIN']
  availableProfiles: ProfileType[];  // backend-controlled; source of truth for profile access
  instructorApprovalStatus: InstructorApprovalStatus;
};

// Local UI state — split across components, not in SettingsPage itself
// AccountActionsPanel owns:
type AccountActionsPanelLocalState = {
  isRefreshing: boolean;      // true while manual refresh API call is in flight
  refreshError: string | null;
};
// InstructorApplicationPanel owns:
type InstructorApplicationPanelLocalState = {
  isApplying: boolean;        // true while POST /instructor-profile/request is in flight
  applyError: string | null;
  bio: string;
  expertise: string;
  experience: string;
  motivation: string;
  fieldErrors: { bio?: string; expertise?: string; experience?: string; motivation?: string };
};
```

**Sources of truth.**
- `user`, `activeProfile`, `logout`, `refreshUser`: from `useAuth()`.
- Fresh user data on mount: call `useCurrentUser()` at the top of `SettingsPage`. This fires `GET /api/v1/auth/me` and hydrates `AuthContext` automatically.
- `isRefreshing`, `refreshError`: local `useState` in `AccountActionsPanel`. `isApplying`, `applyError`, field values, and `fieldErrors`: local `useState` in `InstructorApplicationPanel`. Neither set lives in the top-level `SettingsPage` component.

**Instructor approval status semantics.**

| `instructorApprovalStatus` | Meaning | Settings page behavior |
|---|---|---|
| `null` | No application submitted | Show inline application form with bio, expertise (required), experience, motivation (optional); client-validates before POST |
| `'PENDING'` | Application submitted, awaiting review | Show pending badge and message; no resubmit action |
| `'APPROVED'` | Application approved; instructor role granted | Show approved badge and message |
| `'REJECTED'` | Application rejected | Show rejected badge and message; resubmission is an open decision (§10.3) |

**Role display mapping.**

| `roles` string | Display label | Badge variant |
|---|---|---|
| `'ROLE_LEARNER'` | Learner | `default` |
| `'ROLE_INSTRUCTOR'` | Instructor | `salem` |
| `'ROLE_ADMIN'` | Admin | `azure` |
| Unknown `ROLE_*` string | Strip `ROLE_` prefix, title-case | `default` |

---

## 2. Layout and Structure

The page is a single vertical content column inside `DashboardLayout > main`. Top-to-bottom:

1. **Page shell** (§2.1)
2. **Page header** (§2.2)
3. **Account overview card** (§5.1) — full-width, non-interactive summary
4. **Settings grid** (§2.3):
   - **Left column (main, `minmax(0,1fr)`):** Profile information (§5.2), Learning preferences (§5.5)
   - **Right column (support, `320px` fixed):** Active profile and roles (§5.3), Instructor application (§5.4), Account actions (§5.6)

No `<Container>`, `<SectionHeader>`, `<Stat>`, or marketing chrome belongs on this page.

### 2.1 Page shell

```tsx
<div className="px-8 py-8 pb-14 max-w-container mx-auto">
```

`DashboardLayout` owns `overflow-y-auto` on `<main>`; the page controls its own padding.

### 2.2 Page header

```tsx
<div className="mb-8">
  <h1 className="text-title font-semibold text-text-primary">Settings</h1>
  <p className="text-body-sm text-text-secondary mt-1">
    Manage your account, profile, and learning preferences.
  </p>
</div>
```

### 2.3 Settings grid

```tsx
<div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4">
  {/* Left column */}
  <div className="flex flex-col gap-4">
    {/* Profile information, Learning preferences */}
  </div>
  {/* Right column */}
  <div className="flex flex-col gap-4">
    {/* Active profile and roles, Instructor application, Account actions */}
  </div>
</div>
```

The right column is pinned at `320px` on desktop. The left column fills remaining space. On mobile, both columns collapse into one vertical stack.

**Section stacking order on mobile (single column):**
1. Account overview card
2. Profile information
3. Active profile and roles
4. Instructor application
5. Learning preferences
6. Account actions

### 2.4 Content-column wireframe (lg breakpoint)

```
 px-8 py-8 pb-14 max-w-container mx-auto   (inside DashboardLayout > main)
┌──────────────────────────────────────────────────────────────────────────────┐
│ Settings                               (h1 · text-title · semibold)          │
│ Manage your account, profile, ...      (text-body-sm · text-secondary)       │
│                                                              (mb-8)           │
│ ┌──────────────────────────────────────────────────────────────────────────┐  │
│ │ [Avatar]  Display Name                    [Learner]  [Instructor]       │  │
│ │           email@example.com                                              │  │
│ │           Active: Learner                                                │  │
│ └──────────────────────────────────────────────────────────────────────────┘  │
│                                                              (mb-8)           │
│ grid-cols-[minmax(0,1fr)_320px]  gap-4                                        │
│ ┌────────────────────────────────────┐  ┌────────────────────────────────┐    │
│ │ Profile information                │  │ Active profile and roles       │    │
│ │ ─────────────────────────────────  │  │ ────────────────────────────   │    │
│ │ Full name        Massine A.        │  │ Active profile    [Learner]    │    │
│ │ ─────────────────────────────────  │  │ Available         [L] [I]      │    │
│ │ Email            user@email.com    │  │ Roles             [L] [I] [A]  │    │
│ │ ─────────────────────────────────  │  │                                │    │
│ │ Edit profile / Save changes        │  │ Instructor application         │    │
│ │ (displayName, bio, image URL)      │  │ ────────────────────────────   │    │
│ │                                    │  │ [state-dependent content]      │    │
│ │ Learning preferences               │  │                                │    │
│ │ ─────────────────────────────────  │  │ Account actions                │    │
│ │ Learning preferences (editable,    │  │ ────────────────────────────   │    │
│ │ saved to your account)             │  │ [Refresh account data (sec)]   │    │
│ │                                    │  │ [Sign out (ghost)]             │    │
│ └────────────────────────────────────┘  └────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Responsive Behavior

| Breakpoint | Shell padding | Grid | Notable |
|---|---|---|---|
| base (less than 1024px) | `px-8 py-8` | Single column, sections stacked in mobile order (§2.3) | Sidebar is off-canvas drawer owned by `DashboardLayout`; right-column sections appear below left-column sections |
| `lg` (1024px+) | `px-8 py-8` | Two columns: `minmax(0,1fr)` + `320px` | Right column fixed at `320px`; left column fills remaining space; both columns scroll together inside `DashboardLayout > main` |

**Horizontal padding.** Flat `px-8` at every breakpoint, matching `MyCoursesPage` and `CertificatesPage`. The `ProgressPage` responsive variant (`px-4 sm:px-8`) is a valid mobile enhancement but is a separate, optional cleanup.

**Vertical rhythm.**

| Zone | Spacing |
|---|---|
| Header block | `mb-8` |
| Account overview card | `mb-8` (via `mb-8` on the card itself or its wrapper) |
| Settings grid outer | no margin; follows the overview card directly |
| Gap between sections within each column | `gap-4` (from `flex flex-col gap-4` on each column) |
| Inside section card: padding | `p-4` |
| Inside section card: heading to description | `mt-1` |
| Inside section card: description/heading zone to first row | `mt-4` |
| Inside row: vertical padding | `py-3` |
| Between action buttons in Account Actions | `gap-2` (from `flex flex-col gap-2`) |

---

## 4. Token Mapping

All tokens sourced from `DESIGN.md` and confirmed in `tokens.css`. No new values are introduced.

### 4.1 Page shell and header

| Element | Typography | Weight | Text color | Surface | Border / Radius | Spacing |
|---|---|---|---|---|---|---|
| Shell `<div>` | none | none | none | inherits `bg-bg-base` | none | `px-8 py-8 pb-14 max-w-container mx-auto` |
| H1 "Settings" | `text-title` (28px / 1.3) | `font-semibold` (600) | `text-text-primary` | none | none | header block `mb-8` |
| Subtitle | `text-body-sm` (14px / 1.5) | 400 | `text-text-secondary` | none | none | `mt-1` |

### 4.2 Account overview card

| Element | Typography | Weight | Text color | Surface | Border / Radius | Spacing |
|---|---|---|---|---|---|---|
| Card shell | none | none | none | `bg-surface` | `border border-border-default rounded-lg` | `p-4 flex items-center gap-3 mb-8` |
| Avatar circle | `text-caption` (12px) | `font-semibold` (600) | `text-salem` | `bg-salem-50` | `rounded-full` | `w-10 h-10 flex-shrink-0 flex items-center justify-center select-none` |
| Display name | `text-body-sm` | `font-semibold` (600) | `text-text-primary` | none | none | `truncate` |
| Email | `text-caption` | 400 | `text-text-secondary` | none | none | none |
| Active profile label | `text-caption` | 400 | `text-text-secondary` | none | none | none |
| Role / profile badge row | none | none | none | none | none | `flex flex-wrap items-center gap-1.5 mt-1` |
| No shadow at rest. | | | | | | |

### 4.3 Section card (general pattern)

Each settings section uses a bespoke `<section>` shell rather than the `Card` component. This is required because `CardTitle` renders as `h3`, which would skip `h2` in the heading hierarchy. Settings section headings are semantic `h2` elements.

| Element | Typography | Weight | Text color | Surface | Border / Radius | Spacing |
|---|---|---|---|---|---|---|
| Section `<section>` shell | none | none | none | `bg-surface` | `border border-border-default rounded-lg` | `p-4` |
| Section `<h2>` | `text-title-sm` (22px / 1.4) | `font-semibold` (600) | `text-text-primary` | none | none | none |
| Section description `<p>` | `text-body-sm` (14px / 1.5) | 400 | `text-text-secondary` | none | none | `mt-1` |
| Row divider group | none | none | none | none | `divide-y divide-border-default` | `mt-4` |
| Individual row | none | none | none | none | none | `py-3 flex items-center justify-between gap-4` |
| Row label (`<dt>` or `<span>`) | `text-body-sm` | `font-medium` (500) | `text-text-primary` | none | none | `flex-shrink-0` |
| Row value (`<dd>` or `<span>`) | `text-body-sm` | 400 | `text-text-secondary` | none | none | `text-right min-w-0` |
| Helper / caption text | `text-caption` (12px / 1.5) | 400 | `text-text-secondary` | none | none | `mt-1` |
| No shadow at rest. | | | | | | |

### 4.4 Badge mapping

The `Badge` component applies `text-transform: uppercase` via the `uppercase` CSS class. Badge labels written in title case in this spec render as uppercase in the browser.

| Condition | Label | Variant | Output surface / text |
|---|---|---|---|
| `roles` includes `ROLE_LEARNER` | "Learner" | `default` | `bg-surface-elevated text-text-secondary` |
| `roles` includes `ROLE_INSTRUCTOR` | "Instructor" | `salem` | `bg-salem-50 text-salem` |
| `roles` includes `ROLE_ADMIN` | "Admin" | `azure` | `bg-azure-50 text-azure` |
| `instructorApprovalStatus === 'PENDING'` | "Pending review" | `default` | `bg-surface-elevated text-text-secondary` |
| `instructorApprovalStatus === 'APPROVED'` | "Approved" | `salem` | `bg-salem-50 text-salem` |
| `instructorApprovalStatus === 'REJECTED'` | "Rejected" | `coral` | `bg-coral-50 text-coral-700` |
| `activeProfile === 'LEARNER'` | "Learner" | `default` | `bg-surface-elevated text-text-secondary` |
| `activeProfile === 'INSTRUCTOR'` | "Instructor" | `salem` | `bg-salem-50 text-salem` |

### 4.5 Button mapping

| Action | Variant | Size | Notes |
|---|---|---|---|
| "Submit instructor application" | `secondary` | `sm` | Inside `<form onSubmit>` in the null state panel; `loading` prop while POST is in flight |
| "Refresh account data" | `secondary` | `sm` | `loading` prop while GET is in flight |
| "Sign out" | `ghost` | `sm` | Must be a `<button>`, not an `<a>` |

No `Button variant="primary"` appears anywhere on this page. The page is utility-only; no single action warrants the Salem fill weight. This is consistent with the `CertificatesPage` pattern where all card actions use `variant="secondary"`.

### 4.6 Disabled and unavailable state

For sections or controls that exist in UI scaffolding but have no backend support yet:

| Element | Surface | Text color | Note |
|---|---|---|---|
| `Input` disabled (future editable fields) | `bg-surface-elevated` | `text-text-muted` | `cursor-not-allowed`; pass `disabled` attribute |
| "Coming soon" helper | none | `text-caption text-text-muted` | Below the disabled control or as standalone row |
| Unavailable section placeholder | `bg-surface border border-border-default rounded-lg p-4` | `text-body-sm text-text-secondary` | For whole sections with no current functionality |

---

## 5. Section Specifications

### 5.1 Account Overview Card

A compact, full-width informational card between the page header and the settings grid. Provides a quick-glance summary of the authenticated user's identity, active profile, and roles. It is not a profile hero section and has no interactive elements.

**Shell:** `flex items-center gap-3 bg-surface border border-border-default rounded-lg p-4 mb-8`

**Avatar block** (`flex-shrink-0`):
- Two-letter initials from `user.fullName` using the same `getInitials` logic as `DashboardLayout` (split by space, take first letter of first two words, uppercase).
- Fallback to `"?"` if `user.fullName` is empty.
- Classes: `w-10 h-10 rounded-full bg-salem-50 text-salem flex items-center justify-center text-caption font-semibold leading-none select-none`
- Mark `aria-hidden="true"`: the display name below provides the text equivalent.

**Identity block** (`flex-1 min-w-0`):
- Display name: `text-body-sm font-semibold text-text-primary truncate` — `user.fullName`, fallback to `user.email` if name is empty.
- Email: `text-caption text-text-secondary` — `user.email`.
- Profile and role row (`flex flex-wrap items-center gap-1.5 mt-1`):
  - Active profile indicator: `text-caption text-text-secondary` — e.g. "Active:" followed by a `Badge` for the active profile.
  - One `Badge` per entry in `user.roles` using the mapping in §4.4.
  - `flex-wrap` handles narrower containers without overflow.

**No shadow at rest.** No hover interaction. The overview card is purely informational.

### 5.2 Profile Information

**Purpose:** Displays the user's name and email. No update endpoint exists; all fields are read-only.

**Shell:** `<section aria-labelledby="profile-info-heading" className="bg-surface border border-border-default rounded-lg p-4">`

**Heading:** `<h2 id="profile-info-heading" className="text-title-sm font-semibold text-text-primary">Profile information</h2>`

**Description:** `<p className="text-body-sm text-text-secondary mt-1">Your account name and email address.</p>`

**Row layout:** Definition list `<dl className="divide-y divide-border-default mt-4">`. Each entry:

```tsx
<div className="py-3 flex items-start justify-between gap-4">
  <dt className="text-body-sm font-medium text-text-primary flex-shrink-0">Full name</dt>
  <dd className="text-body-sm text-text-secondary text-right min-w-0 break-words">
    {user.fullName || 'Not set'}
  </dd>
</div>
```

**Rows:**

| Label | Value | Fallback |
|---|---|---|
| Full name | `user.fullName` | "Not set" |
| Email | `user.email` | none (always present) |

**Account identity is read-only.** Full name (`user.fullName`) and email (`user.email`) are account-identity fields with no self-edit endpoint, so they stay as definition-list rows. A definition list is semantically correct for read-only data and does not mislead assistive technology into expecting interaction. Do not render `Input` components for these two fields.

**Editable learner profile (shipped).** Below the identity `<dl>`, the section renders the learner's own profile fields — `displayName`, `bio`, and `profileImageUrl` — loaded from `GET /api/v1/learner-profile/me`. A read view shows the current values with an "Edit profile" button; activating it swaps to a `FormField` + `Input` / `<textarea>` form with a `Button` — "Save changes" action that persists via `PATCH /api/v1/learner-profile/me` (self-edit only; no profile id in the URL). Loading, field-validation, and save-error states are handled inline. This resolves the former open decision (§10.1).

### 5.3 Active Profile and Role Status

**Purpose:** Shows the user's active session profile and all available profiles and granted roles. Reflects backend-controlled `user.availableProfiles` and `user.roles`.

**Shell:** Same pattern as §5.2. `aria-labelledby="active-profile-heading"`.

**Heading:** "Active profile and roles"

**Description:** "Your current session and available account profiles."

**Row layout:** Same `<dl className="divide-y divide-border-default mt-4">` pattern.

| Label | Value | Notes |
|---|---|---|
| Active profile | `Badge` for `activeProfile` (see §4.4) | From `useAuth()` |
| Available profiles | Row of `Badge` elements from `user.availableProfiles` | Learner always present; Instructor only if in `availableProfiles` |
| Roles | Row of `Badge` elements from `user.roles` | One badge per role string using §4.4 mapping |

**Profile switching note.** Do not place a profile-switch control on this page in v1. The active profile badge is read-only status. Whether profile switching belongs here is an open decision (§10.6).

### 5.4 Instructor Application

**Purpose:** Full authoritative view of the instructor application state. This is the destination that `DashboardLayout`'s sidebar "Apply now" link points to. It shows the current state and surfaces the appropriate action.

**Shell:** Same pattern as §5.2. `aria-labelledby="instructor-application-heading"`.

**Heading:** "Instructor application"

This section renders different content based on `user.instructorApprovalStatus`. Four states:

#### State: `null` — No application submitted

**Description:** "Share your expertise with learners on Learnova."

**Admin visibility guard.** This panel is conditionally rendered in `SettingsPage`:
```tsx
{(!user.roles.includes('ROLE_ADMIN') || user.availableProfiles.includes('INSTRUCTOR')) && (
  <InstructorApplicationPanel />
)}
```
A pure admin account (admin role but no `'INSTRUCTOR'` in `availableProfiles`) does **not** see this panel. An admin who has also been approved as an instructor does see it (in the APPROVED state). A learner or pending/rejected user always sees it.

Content after the heading zone — an inline `<form onSubmit noValidate>`:

```tsx
<form onSubmit={handleSubmit} noValidate className="mt-4 flex flex-col gap-4">
  <p className="text-body-sm text-text-secondary">
    Tell us about your background. Fields marked with * are required.
  </p>

  {/* Bio — required */}
  <FormField label="Bio *" htmlFor="instructor-bio" error={fieldErrors.bio} hint="Max 1000 characters.">
    <textarea id="instructor-bio" rows={3} maxLength={1000}
      placeholder="Share your teaching background and what you specialize in."
      aria-invalid={fieldErrors.bio ? true : undefined} />
  </FormField>

  {/* Expertise — required */}
  <FormField label="Expertise *" htmlFor="instructor-expertise" error={fieldErrors.expertise} hint="Max 500 characters.">
    <Input id="instructor-expertise" maxLength={500} hasError={!!fieldErrors.expertise}
      placeholder="e.g. JavaScript, React, Web Development" />
  </FormField>

  {/* Experience — optional */}
  <FormField label="Experience" htmlFor="instructor-experience" error={fieldErrors.experience} hint="Optional. Max 1000 characters.">
    <textarea id="instructor-experience" rows={3} maxLength={1000}
      placeholder="Describe your teaching or professional experience."
      aria-invalid={fieldErrors.experience ? true : undefined} />
  </FormField>

  {/* Motivation — optional */}
  <FormField label="Motivation" htmlFor="instructor-motivation" error={fieldErrors.motivation} hint="Optional. Max 1000 characters.">
    <textarea id="instructor-motivation" rows={3} maxLength={1000}
      placeholder="Why do you want to teach on Learnova?"
      aria-invalid={fieldErrors.motivation ? true : undefined} />
  </FormField>

  <div>
    <Button type="submit" variant="secondary" size="sm"
      loading={isApplying} aria-label="Submit instructor application">
      Submit instructor application
    </Button>
    {applyError && (
      <p className="text-caption text-error mt-1" role="alert">{applyError}</p>
    )}
  </div>
</form>
```

**Backend contract.** `POST /api/v1/instructor-profile/request` requires a JSON body:
```json
{
  "bio": "<trimmed, required, max 1000 chars>",
  "expertise": "<trimmed, required, max 500 chars>",
  "experience": "<trimmed string or null>",
  "motivation": "<trimmed string or null>"
}
```
Returns `InstructorProfileResponse` (contains `approvalStatus`, not user data). The frontend discards this response.

**Client validation (runs before network call).** Both required fields are `.trim()`-checked; whitespace-only input is treated as empty and rejected. Optional fields are length-checked only. On validation failure: `setFieldErrors` populates errors, `return` short-circuits the handler — no network call is made. Each field error renders as a `role="alert"` paragraph via `FormField`.

**Submit flow on success:**
1. `POST /api/v1/instructor-profile/request` → 201
2. `GET /api/v1/auth/me` → 200
3. `refreshUser(data)` updates `AuthContext` with `instructorApprovalStatus: 'PENDING'`
4. `InstructorApplicationPanel` re-renders into the PENDING state
5. `DashboardLayout` sidebar CTA disappears (same `user` reference)
6. No page reload, no logout, no redirect

**Submit flow on error (non-401/403).** Sets `applyError`; inline message appears below the submit button. Values remain in form fields. The Axios response interceptor owns 401 (logout + redirect to `/login`) and 403 (redirect to `/unauthorized`); the panel does not handle these cases.

#### State: `'PENDING'` — Under review

**Description:** "Your application is under review."

Content after the heading zone:
```tsx
<div className="mt-4">
  <div className="flex items-start gap-2.5">
    <Badge variant="default">Pending review</Badge>
    <p className="text-body-sm text-text-secondary">
      Your application has been submitted and is awaiting admin review.
    </p>
  </div>
  <p className="text-caption text-text-muted mt-3">
    No action is required. You will gain access to instructor mode once approved.
  </p>
</div>
```

No resubmit action. No estimated wait time.

#### State: `'APPROVED'` — Application approved

**Description:** "Your instructor application has been approved."

Content after the heading zone:
```tsx
<div className="mt-4 flex items-start gap-2.5">
  <Badge variant="salem">Approved</Badge>
  <p className="text-body-sm text-text-secondary">
    You have access to instructor mode.
  </p>
</div>
```

If `user.availableProfiles` includes `'INSTRUCTOR'`, optionally add a "Switch to instructor mode" action — contingent on the open decision in §10.6.

#### State: `'REJECTED'` — Application rejected

**Description:** "Your instructor application was not approved."

**Rejection reason fetch.** When `instructorApprovalStatus === 'REJECTED'`, `InstructorApplicationPanel` lazily fetches `GET /api/v1/instructor-profile/me` via `useEffect` to retrieve `rejectionReason`. The field is on `InstructorProfileResponse` but absent from `CurrentUserResponse` (auth/me). The effect is guarded by a cancellation flag to prevent stale updates on unmount. On network error the effect is silently ignored and `rejectionReason` stays `null`.

Content after the heading zone:
```tsx
<div className="mt-4">
  <div className="flex items-start gap-2.5">
    <Badge variant="coral">Rejected</Badge>
    <p className="text-body-sm text-text-secondary">
      Your application was not approved at this time.
    </p>
  </div>
  {/* Only rendered when rejectionReason is truthy */}
  {rejectionReason && (
    <div className="mt-3 rounded-md border border-border-default bg-surface-elevated p-3">
      <p className="text-caption font-medium text-text-muted">Reason</p>
      <p className="text-body-sm text-text-secondary mt-1">{rejectionReason}</p>
    </div>
  )}
  <p className="text-caption text-text-muted mt-3">
    Contact support if you have questions about your application status.
  </p>
</div>
```

**Token notes.** The reason block uses `bg-surface-elevated` (third depth tier) inside the `bg-surface` section card. No new tokens. Label uses `text-caption font-medium text-text-muted`; body uses `text-body-sm text-text-secondary`.

Whether to offer resubmission is §10.3.

### 5.5 Learning Preferences

**Purpose:** Editable per-user preferences (learning goal, preferred level, weekly goal minutes, preferred categories), backed by `GET/PUT /api/v1/learner-profile/me/preferences`. The same `LearningPreference` record is read and written by the onboarding wizard (`/onboarding`) — Settings is the persistent edit surface for whatever the learner set (or skipped) during onboarding.

**Shell:** Same pattern as §5.2. `aria-labelledby="learning-prefs-heading"`.

**Heading:** "Learning preferences"

**Description:** "Customize your learning experience."

**Content:** A form (`LearningPreferencesSection`) with a learning-goal select, preferred-level select, weekly-goal-minutes number input, and a checkbox set of up to 8 preferred categories, each defaulting to "No preference set" / unselected when unset. A "Save preferences" button submits via the preferences endpoint; loading, save-error, and success states are handled inline.

No recommendation engine or course filtering currently reads these values back, and no reminder/notification scheduling is wired to `weeklyGoalMinutes` — they are stored for future personalization only. Do not imply either capability exists in any copy added to this section.

### 5.6 Account Actions

**Purpose:** Low-frequency, session-level actions. Sign out and optional manual data refresh.

**Shell:** Same pattern as §5.2. `aria-labelledby="account-actions-heading"`.

**Heading:** "Account actions"

**Description:** "Manage your current session."

**Content:**
```tsx
<div className="mt-4 flex flex-col gap-2">
  <div>
    <Button
      variant="secondary"
      size="sm"
      loading={isRefreshing}
      aria-label="Refresh account data"
    >
      Refresh account data
    </Button>
    {refreshError && (
      <p className="text-caption text-error mt-1" role="alert">{refreshError}</p>
    )}
  </div>
  <Button
    variant="ghost"
    size="sm"
    aria-label="Sign out of your account"
  >
    Sign out
  </Button>
</div>
```

**Refresh behavior:** On click, call `api.get('/api/v1/auth/me')` then `refreshUser(data)` on success. On failure (non-401, non-403 error), set `refreshError`. On 401, the Axios interceptor handles logout and redirect to `/login` automatically. On 403, the interceptor redirects to `/unauthorized`. The settings page does not handle those cases explicitly.

See §10.7 for the open decision on whether `useCurrentUser` should expose a callable `refresh()` function instead.

**Sign out behavior:** Calls `logout()` from `useAuth()`. Must be a `<button>` element, not an `<a>` tag. No confirmation dialog: sign out is easily recoverable (log back in).

No password change row. No account deletion row. Both require backend endpoints that do not exist.

---

## 6. Component Reusability

### 6.1 Reuse from the existing codebase

| Component | Path | Variant / Prop | Role on Settings page |
|---|---|---|---|
| `Button` | `components/ui/Button.tsx` | `variant="secondary" size="sm"` | "Apply to become an instructor", "Refresh account data" |
| `Button` | `components/ui/Button.tsx` | `variant="ghost" size="sm"` | "Sign out" |
| `Button` | `components/ui/Button.tsx` | `loading` prop | In-flight state for apply and refresh |
| `Badge` | `components/ui/Badge.tsx` | `variant="default"` | Learner role, pending review, active Learner profile |
| `Badge` | `components/ui/Badge.tsx` | `variant="salem"` | Instructor role, approved status, active Instructor profile |
| `Badge` | `components/ui/Badge.tsx` | `variant="azure"` | Admin role |
| `Badge` | `components/ui/Badge.tsx` | `variant="coral"` | Rejected status |

**On `Card` and heading hierarchy.** `Card variant="stat"` maps to `bg-surface border border-border-default rounded-lg p-4`, which matches the section card padding. However, `CardTitle` renders as `h3`, which skips `h2` in the heading order (H1 "Settings" to H3 section title, bypassing H2). All settings section headings must be semantic `h2` elements. Use bespoke `<section>` + `<h2>` shells for every section card.

**On `Input` and `FormField`.** Appropriate for future editable profile fields. The `Input` component supports `disabled` state (`bg-surface-elevated text-text-muted cursor-not-allowed`). `FormField` wires `aria-describedby` for the hint/error line automatically. Not used in v1 because all fields are read-only; using disabled `Input` for structurally read-only data misleads assistive technology into expecting interaction.

### 6.2 Possible local components

Extract only when a pattern repeats or when isolated internal state justifies it.

| Component | Suggested path | Extraction justification |
|---|---|---|
| `SettingsSection` | `features/dashboard/components/SettingsSection.tsx` | Shared shell (`<section>` + `<h2>` + description + `divide-y` rows) used by all six sections; extraction removes structural repetition |
| `InfoRow` | `features/dashboard/components/InfoRow.tsx` | Label-value definition-list row used in Profile Information and Active Profile sections |
| `ProfileStatusPanel` | Local to `SettingsPage.tsx` | Renders active profile badge and available profile badges; does not need to be shared with other pages |
| `InstructorApplicationPanel` | Local to `SettingsPage.tsx` | Branches on four `instructorApprovalStatus` states; isolating this logic makes `SettingsPage` readable |
| `AccountActionsPanel` | Local to `SettingsPage.tsx` | Manages its own `isRefreshing` and `refreshError` local state |

Do not promote `SettingsSection` or `InfoRow` to `components/ui/` unless adopted by pages outside the dashboard feature.

### 6.3 Components that do not fit

| Component | Reason |
|---|---|
| `Container` | Marketing width primitive; dashboard shell uses inline `px-8 max-w-container mx-auto` |
| `SectionHeader` | Marketing header at `text-display` / `text-headline` scale; wrong for dashboard content |
| `Stat` | Renders at `text-headline` (40px) or `text-display` (56px); built for hero metrics; nothing on the settings page is a hero metric |
| `TestimonialCard` | Social-proof composition; unrelated to account settings |
| `CourseCard` | Enrolled-course card; unrelated |
| `Card` + `CardTitle` | `CardTitle` renders as `h3`, skipping `h2` in the heading hierarchy |
| Hero metric grids | Named anti-pattern in `DESIGN.md` |
| Gradient text | Explicitly prohibited by `DESIGN.md` |
| Glassmorphism | Explicitly prohibited by `DESIGN.md` |
| Large Salem backgrounds | Salem is reserved for full-bleed brand pages, not dashboard panels |

---

## 7. Empty, Loading, and Error States

### 7.1 Loading state

`useCurrentUser` fires on mount via `useEffect`. The component may briefly render with `user === null` while `isAuthenticated === true` (token present, user not yet hydrated from the API call).

**Recommended handling:** Check `user === null && isAuthenticated` at the top of `SettingsPage`. If true, render a compact loading panel:

```
Shell:   bg-surface border border-border-default rounded-lg p-4
Content: text-body-sm text-text-secondary — "Loading account information..."
```

Do not redirect from this transient state. `ProtectedRoute` handles unauthenticated cases.

**Skeleton variant (if preferred over a message panel):**
- Account overview: `bg-surface border border-border-default rounded-lg h-16 animate-pulse mb-8`
- Each section card: `bg-surface border border-border-default rounded-lg h-32 animate-pulse`

Do not use `animate-pulse` without wrapping in `motion-safe:` unless confirmed that Tailwind's `animate-pulse` already respects `prefers-reduced-motion` in the project's Tailwind version.

### 7.2 Empty state: user null after load

If `user` is `null` after `useCurrentUser` has had time to complete and `isAuthenticated` is still `true`, an unexpected error occurred.

```
Shell:   bg-surface border border-border-default rounded-lg p-4
Title:   "Account information is unavailable."
         text-body-sm font-semibold text-text-primary mb-1
Body:    "Please try refreshing the page or signing in again."
         text-body-sm text-text-secondary mb-3
Action:  "Sign out"
         Button variant="secondary" size="sm"
         Calls logout() then navigates to /login
```

Do not redirect automatically. Let the user decide to sign out.

### 7.3 Refresh error

If the manual "Refresh account data" action fails:

```
Inline, below the "Refresh account data" button:
text-caption text-error mt-1 role="alert"
"Could not refresh account data. Please try again."
```

Clear the error when the user retries successfully. Do not replace the entire page content for a single action failure.

If the response is 401, the Axios interceptor calls `logout()` and redirects to `/login`. If 403, it redirects to `/unauthorized`. The settings page handles neither case directly.

### 7.4 Instructor application action error

If `POST /api/v1/instructor-profile/request` fails (non-401, non-403):

```
Inline, below the submit button:
text-caption text-error mt-1 role="alert"
"We could not submit your instructor application. Please try again."
```

Field values are preserved. The form remains visible. Clear `applyError` on the next successful submit. No modal, no full-section takeover for a single action failure. 401 and 403 are handled by the Axios response interceptor, not by this component.

---

## 8. Accessibility Notes

**Heading order.** H1 "Settings" is the single page title. Each section uses a semantic `h2` with an `id` for `aria-labelledby`. No heading levels are skipped. If sub-sections within a section are added in future, they use `h3`.

**Landmark regions.** Each section uses `<section aria-labelledby="{id}">`. The account overview card uses `<div>` (it is a status summary, not a page section). `DashboardLayout` provides `<main id="main-content" tabIndex={-1}>`. No additional `<main>` is needed.

**Skip link.** `DashboardLayout` already provides a skip-link targeting `#main-content`. No additional skip-link work is required on this page.

**Definition lists.** Profile information and active profile rows use `<dl>` / `<dt>` / `<dd>` semantics. Each row is wrapped in a `<div>` inside the `<dl>` (the HTML spec allows `<div>` wrappers inside `<dl>` for styling). Screen readers announce label-value pairs correctly.

**Buttons vs. links.** All non-navigating actions must use `<button>`. Sign out, "Apply to become an instructor", and "Refresh account data" do not navigate to a new URL and must not use `<a>`.

**Form field hints.** The editable learner-profile fields (`displayName`, `bio`, `profileImageUrl`) use the `FormField` `hint` prop for guidance (e.g. character limits) and the `error` prop for validation messages; `FormField` wires `aria-describedby` automatically. The read-only identity rows (full name, email) are `<dl>` rows, not disabled `Input`s, so no "disabled because…" hint is needed.

**Badge text.** All `Badge` components render visible text. Status is not communicated through color alone. The `Badge` component's `uppercase` CSS transforms text visually; the DOM content retains the case written in JSX, which screen readers announce.

**Error announcements.** Inline errors (`refreshError`, `applyError`) use `role="alert"` so screen readers announce them on appearance without requiring focus movement.

**Avatar.** The avatar circle is `aria-hidden="true"`. The display name below provides the text equivalent.

**Focus rings.** All interactive elements use `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem`. `Button` already includes this. Custom interactive elements (if any are added) must include the same classes.

**Minimum touch targets.** `Button size="sm"` enforces `min-h-[44px]`. Any custom interactive element must also meet `min-h-[44px]`.

**Keyboard navigation.** All interactive elements are reachable by `Tab`. No focus traps. No modal dialogs are specified.

**No interactive elements inside non-interactive containers.** The account overview card is non-interactive; it contains no buttons or links. Section cards are non-interactive containers; interactive children are direct descendants of section content, not nested inside a clickable shell.

**Reduced motion.** No entrance animations are specified on this page. Wrap skeleton `animate-pulse` and other transitions in `motion-safe:` where applicable.

---

## 9. Design-Rule Compliance Notes

**Flat-At-Rest Rule.** No shadow at rest on any element. Section cards, the account overview card, and all panels use `border border-border-default` on `bg-surface`. No `shadow-*` class appears at rest. No hover-lift applies: no section is a clickable container.

**Forest Rule (one primary per zone).** No `Button variant="primary"` (Salem fill) appears anywhere on this page. All actions use `variant="secondary"` or `variant="ghost"`. The page is utility-only. This is consistent with the `CertificatesPage` pattern.

**Salem surface area.** Salem appears only as: badge and avatar backgrounds (`bg-salem-50`), text color for instructor/approved/active-instructor badges and avatar initials (`text-salem`), focus rings, and button ghost text. No Salem backgrounds fill section cards or the overview card. Well within the 15% surface area cap.

**The Field Rule.** Coral appears only on the "Rejected" instructor application badge, a status-bearing context requiring user attention. Anzac does not appear on this page (no achievement or completion context). Neither Coral nor Anzac is used decoratively.

**No hero-metric grid.** The account overview card is a single compact row. No `Stat` component. No value renders at `text-headline` (40px) or `text-display` (56px). The three-metric-cards-in-a-row pattern is the SaaS anti-pattern named in `DESIGN.md`; it does not appear.

**No gradient text.** No `background-clip: text` with a gradient fill. Emphasis is conveyed by weight (`font-semibold`) and size contrast (`text-title-sm` vs. `text-body-sm`).

**No glassmorphism.** No `backdrop-filter: blur` on this page. Backdrop blur is reserved for the sticky navbar's scrolled state.

**No large Salem backgrounds.** No Salem-filled section panels. Section cards use `bg-surface` (white) on `bg-bg-base` (page canvas).

**No accent stripes.** All card and panel borders are full-perimeter `border border-border-default`. No `border-left` or `border-right` in color as a decorative stripe.

**Three-tier depth maximum.** `bg-bg-base` (page) > `bg-surface` (section cards, overview card) > `bg-surface-elevated` (disabled input backgrounds, skeleton placeholders). No deeper nesting.

**Type scale.** H1 at `text-title` (28px), section H2 at `text-title-sm` (22px), body text and labels at `text-body-sm` (14px), helper text and metadata at `text-caption` (12px). No `text-headline` or `text-display` inside the dashboard content column. No intermediate scale between `text-body-sm` and `text-body`.

**Single typeface.** Inter only at all scales.

**No em dashes in copy.** All prose uses commas, colons, semicolons, or periods.

**Professional utility tone.** Section headings are functional nouns. Copy is direct and informative. No motivational language, no achievement framing, no urgency theater.

**Dashboard, not marketing.** No `Container`, `SectionHeader`, or `Stat` components. No full-width colored section bands. No marketing-register typography.

**Sidebar relationship.** The sidebar CTA and pending note in `DashboardLayout` are summary affordances. This settings page is the full-detail view. The two do not duplicate each other: the sidebar surfaces awareness and links here; the settings page surfaces state and action. This split respects the DESIGN.md principle of hierarchy doing the work.

---

## 10. Open Decisions

The following items require a decision before or during implementation. None block the spec; each must be resolved before the relevant feature ships.

**1. Profile editing: read-only or editable? — RESOLVED (shipped).**
Profile editing is shipped for the learner's own editable fields — `displayName`, `bio`, and `profileImageUrl` — via `GET`/`PATCH /api/v1/learner-profile/me` (self-edit only; no profile id in the URL). The Personal information section (§5.2) shows these in a read view with an "Edit profile" button that swaps to a `FormField` + `Input` form with a "Save changes" action. Account-identity fields — full name and email — remain read-only definition-list rows because no self-edit endpoint exists for them.

**2. Learning preferences: local-only, hidden, or placeholder? — RESOLVED (shipped, backend-persisted).**
Learning preferences are backend-persisted and editable in Settings (§5.5), not a placeholder. The `LearningPreferencesSection` form reads and writes the learner's `LearningPreference` record via the learner-profile preferences endpoint; the onboarding wizard (`/onboarding`) reuses the same record/API, so Settings is the persistent edit surface for whatever was set (or skipped) during onboarding. Caveats that still hold: no recommendation engine or course filtering reads these values back yet, no reminder/notification scheduling is wired to `weeklyGoalMinutes`, and copy must not imply any personalization that does not exist.

**3. Rejected instructor application: resubmission allowed?**
The spec shows only a rejection message and a contact-support note. Options:
- **Option A (as specced).** No resubmit action.
- **Option B.** Show a `Button variant="secondary" size="sm"` — "Apply again", calling `POST /api/v1/instructor-profile/request` if the backend allows repeat submissions after rejection.
Decision depends on whether the backend endpoint accepts a second request after a rejection. Verify with the backend team before implementing Option B.

**4. Password change: v1 or deferred?**
No password change endpoint exists. Options:
- **Option A (recommended).** Omit entirely for v1. Add when the endpoint is ready.
- **Option B.** Add a disabled row as a placeholder with "Password change coming soon." helper text.
Recommended: Option A. A visible-but-nonfunctional password control adds noise without value.

**5. Account deletion: v1 or deferred?**
No account deletion endpoint exists. Options:
- **Option A (recommended).** Omit entirely for v1.
- **Option B.** Add a `Button variant="destructive" size="sm"` — "Delete account", disabled, with a "coming soon" caption.
Recommended: Option A. Destructive controls without backend backing introduce confusion and risk.

**6. Active profile switching: settings page or sidebar/topbar only?**
The topbar shows the active profile label but no switch affordance. Options:
- **Option A.** Profile switching belongs only in the sidebar or topbar, designed separately. The settings page shows the current profile as read-only status.
- **Option B.** Add a `Button variant="secondary" size="sm"` — "Switch to instructor mode" in the Active Profile and Role Status section, guarded by `user.availableProfiles.includes('INSTRUCTOR')`. This calls `setActiveProfile('INSTRUCTOR')` from `useAuth()` and is already supported in `AuthContext`.
Recommended: Option B is appropriate if no other switch affordance exists. If a sidebar or topbar switch is designed later, remove the settings page control to avoid two switching entry points. Decide after the topbar UX is finalized.

**7. Manual refresh: local API call or hook-exposed trigger?**
`useCurrentUser` fires on mount but provides no retrigger. Options:
- **Option A (as specced).** The settings page calls `api.get('/api/v1/auth/me')` directly, then `refreshUser(data)`. This duplicates the `useCurrentUser` internals.
- **Option B (recommended).** Extend `useCurrentUser` to return a `refresh: () => Promise<void>` function. The settings page calls `refresh()` from the button handler. The hook owns the response shape and the `refreshUser` call, removing duplication.
Recommended: Option B for separation of concerns. The hook already knows the API path and response shape.

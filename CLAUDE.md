# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Learnova is a full-stack online learning platform (4th-year PFA project) with a modular monolith backend and a React frontend. It features a **dual-profile system**: one user account can operate as both a learner and an instructor simultaneously.

## Repository Layout

```
backend/    → Spring Boot application (Maven, Java 17)
frontend/   → React + TypeScript application (Vite)
docs/       → Architecture decisions and wireframes
```

## Backend Commands

All commands run from the `backend/` directory.

```bash
# Start the dev server
./mvnw spring-boot:run

# Build
./mvnw clean package

# Run all tests
./mvnw test

# Run a single test class
./mvnw test -Dtest=AuthLoginIntegrationTest

# Run tests matching a pattern
./mvnw test -Dtest="Auth*"
```

**Environment:** Copy `backend/.env.example` to `backend/.env`. Required variables: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRATION_MS`. Defaults are provided in `application.yaml` for local development.

**Test database:** Tests use an in-memory H2 database (PostgreSQL-compatibility mode) via `src/test/resources/application-test.yml`. No external database is needed to run tests.

## Frontend Commands

All commands run from the `frontend/` directory.

```bash
npm run dev      # Start Vite dev server (http://localhost:5173)
npm run build    # TypeScript check + production build
npm run lint     # ESLint
```

**Environment:** Copy `frontend/.env.example` to `frontend/.env`. Set `VITE_API_BASE_URL=http://localhost:8080/api/v1`.

## Backend Architecture

**Base package:** `com.learnova.learnova_backend`

Each feature is a sub-package following this layout:
```
<module>/
  controller/   → @RestController, maps HTTP → service calls
  service/      → business logic
  dto/          → request/response POJOs (Lombok, Bean Validation)
  entity/       → JPA entities (Lombok builder pattern)
  repository/   → Spring Data JPA interfaces
```

**Current modules:**
- `auth` — registration, login, `/api/v1/auth/me`
- `user` — `User` entity, `Role`/`RoleName`, `AccountStatus`, `RoleSeeder`
- `profile` — `LearnerProfile`, `InstructorProfile`, profile switching, admin approval
- `course` — `Course`, `Category`, instructor course CRUD, public course catalog, lesson progress, quiz authoring (quizzes/questions/answer options), wishlist
- `enrollment` — learner enrollment in published courses, enrollment listing/lookup
- `security` — JWT filter, `CustomUserDetails`, `SecurityConfig`, `JwtService`, account-status checks, security error dispatch

**Security model:**
- Stateless JWT — `JwtAuthenticationFilter` validates the token before every request
- `CustomUserDetails` wraps `User` and exposes roles as `GrantedAuthority`
- Method-level authorization via `@PreAuthorize("hasRole('INSTRUCTOR')")` — `@EnableMethodSecurity` is active
- CORS is configured to allow `http://localhost:5173`

**Role seeding:** `RoleSeeder` (a `CommandLineRunner`) inserts all `RoleName` enum values into the `roles` table on startup if they don't exist. Do not seed roles manually.

**Dual-profile domain rules:**
- `User` = identity. `LearnerProfile` and `InstructorProfile` are 1-to-1 with `User`.
- A learner profile is created automatically on registration.
- An instructor profile is created by user request and must be approved by an ADMIN before the instructor role is granted.
- `ProfileAccessService.resolveAvailableProfiles()` is the single source of truth for what profiles a user can switch to.
- Learning data belongs to `LearnerProfile`; teaching data belongs to `InstructorProfile`.

**JPA conventions:**
- Timestamps use `Instant` (not `LocalDateTime`).
- `@PrePersist` / `@PreUpdate` set `createdAt` / `updatedAt`.
- Production DDL: `ddl-auto: update`. Test DDL: `create-drop`.

## Frontend Architecture

**Design system:** `DESIGN.md` at the project root is the canonical design system. Before generating any UI, read these in order:
1. `PRODUCT.md` — product purpose, user profiles, brand personality, and design principles
2. `DESIGN.md` — all tokens: colors, typography, spacing, shadows, radii, and component behavior
3. `docs/design/page-specs/<page>.md` — the page-specific layout spec for the surface being built (e.g., `docs/design/page-specs/my-courses-page.md`)

For the landing page specifically, use `docs/design/final-specs/landing-page.md` as the page spec.

**Auth state** lives in `AuthContext` (`src/context/AuthContext.tsx`). It stores the JWT token, user object, and `activeProfile` in `localStorage`. `useAuth()` is the hook to consume it.

**Routing** (`src/router/index.tsx`) uses React Router v7. `ProtectedRoute` redirects unauthenticated users to `/login`. `GuestRoute` redirects authenticated users away from auth pages.

**Feature pages** live under `src/features/<feature>/pages/`. Shared components go under `src/components/common/`. API calls are centralized in `src/api/axios.ts`.

### Active Profile Switching

`ProfileType` (`src/types/profile.ts`) is `'LEARNER' | 'INSTRUCTOR'`. The `activeProfile` field in `AuthContext` controls which dashboard/experience is rendered.

**Rules:**
- Users are registered as learners. `login()` always initialises `activeProfile` to `'LEARNER'`.
- The `User` object in `AuthContext` carries three profile-relevant fields from `/api/v1/auth/me`:
  - `availableProfiles: ProfileType[]` — the profiles the user may actually switch to (backend-controlled).
  - `roles: string[]` — granted roles (`ROLE_LEARNER`, `ROLE_INSTRUCTOR`, `ROLE_ADMIN`).
  - `instructorApprovalStatus: string | null` — `null` (no request), `'PENDING'`, `'APPROVED'`, or `'REJECTED'`.
- `setActiveProfile()` is only valid for a profile listed in `user.availableProfiles`. Never allow switching to `'INSTRUCTOR'` unless `availableProfiles` includes it.
- **Backend is the source of truth.** Do not derive instructor access from `activeProfile` alone or from stale localStorage. Use `useCurrentUser` (`src/hooks/useCurrentUser.ts`) on app load to re-fetch `/api/v1/auth/me` and refresh the user object.
- UI states to surface based on `instructorApprovalStatus`:
  - `null` → show "Become an Instructor" CTA.
  - `'PENDING'` → show pending badge; hide Instructor mode option.
  - `'APPROVED'` → `availableProfiles` will include `'INSTRUCTOR'`; show profile switcher.
  - `'REJECTED'` → show rejected status; optionally allow resubmission depending on implementation.

### Route Guard Patterns

Route guards live in `src/components/common/`. Do not duplicate authorization logic inside individual pages.

| Guard | File | Behaviour |
|-------|------|-----------|
| `GuestRoute` | `GuestRoute.tsx` | Redirects authenticated users to `/` |
| `ProtectedRoute` | `ProtectedRoute.tsx` | Redirects unauthenticated users to `/login` |
| `InstructorRoute` | `InstructorRoute.tsx` | Requires authenticated + `'INSTRUCTOR'` in `user.availableProfiles`; redirects to `/unauthorized` |
| `AdminRoute` | `AdminRoute.tsx` | Requires authenticated + `'ROLE_ADMIN'` in `user.roles`; redirects to `/unauthorized` |

**Route categories:**

- **Public** — landing page, course catalog, course detail pages. No guard.
- **Guest-only** — `/login`, `/register`. Wrapped in `GuestRoute`.
- **Protected** — dashboard, settings, learner pages. Wrapped in `ProtectedRoute`.
- **Instructor** — course management, course editor. Wrap in `InstructorRoute` (checks `user.availableProfiles`).
- **Admin** — admin panel, instructor approval. Wrap in `AdminRoute` (checks `user.roles`).

Unauthorized access to instructor/admin routes should redirect to `/unauthorized`, not to `/login`, since the user is already authenticated.

### Axios Interceptor Setup

The shared client is `src/api/axios.ts`. Never import axios directly in feature code; always use this instance.

**Request interceptor** — reads `token` from `localStorage` and attaches `Authorization: Bearer <token>`. Do not add auth headers manually in API call files.

**Response interceptor** — fully implemented and wired at runtime:
- `setupApiInterceptors(handlers)` in `src/api/axios.ts` registers the response interceptor. It ejects any prior registration before adding a new one, preventing duplicates on re-mount.
- `ApiInterceptorSetup` (`src/components/common/ApiInterceptorSetup.tsx`) is a React component that calls `useAuth()` and `useNavigate()`, then calls `setupApiInterceptors` inside a `useEffect`. This bridges React state (`logout`) and routing (`navigate`) into the plain-module Axios layer.
- `RootLayout` (`src/components/common/RootLayout.tsx`) renders `<ApiInterceptorSetup />` as the first child of the pathless root route, so it is mounted for every route in the app.

**401 Unauthorized** — calls `logout()` (clears token, user, and activeProfile from localStorage and React state), then redirects to `/login` with `replace: true`. A guard skips the redirect if the current path is already `/login` or `/register` to prevent redirect loops.

**403 Forbidden** — redirects to `/unauthorized` with `replace: true`. Does **not** call `logout()` — the user is authenticated but lacks permission.

**Invariant:** `useAuth()` must never be called directly inside `axios.ts`. `axios.ts` is a plain module outside the React tree. Pass callbacks in via `setupApiInterceptors`.

## API Surface (current)

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/v1/auth/register` | Public |
| POST | `/api/v1/auth/login` | Public |
| GET | `/api/v1/auth/me` | Authenticated |
| GET/POST | `/api/v1/categories` | GET public, POST ADMIN |
| GET | `/api/v1/categories/{id}` | Public |
| POST | `/api/v1/profile/switch` | Authenticated |
| POST | `/api/v1/instructor-profile/request` | Authenticated |
| GET | `/api/v1/instructor-profile/me` | Authenticated |
| GET | `/api/v1/admin/instructor-profiles/pending` | ADMIN |
| POST | `/api/v1/admin/instructor-profiles/{id}/approve` | ADMIN |
| POST | `/api/v1/admin/instructor-profiles/{id}/reject` | ADMIN |
| POST | `/api/v1/instructor/courses` | INSTRUCTOR |
| PATCH | `/api/v1/instructor/courses/{id}` | INSTRUCTOR |
| POST | `/api/v1/instructor/courses/{courseId}/quizzes` | INSTRUCTOR |
| PUT | `/api/v1/instructor/courses/quizzes/{quizId}` | INSTRUCTOR |
| PATCH | `/api/v1/instructor/courses/quizzes/{quizId}/publish` | INSTRUCTOR |
| PATCH | `/api/v1/instructor/courses/quizzes/{quizId}/archive` | INSTRUCTOR |
| POST | `/api/v1/instructor/courses/quizzes/{quizId}/questions` | INSTRUCTOR |
| PUT | `/api/v1/instructor/courses/questions/{questionId}` | INSTRUCTOR |
| DELETE | `/api/v1/instructor/courses/questions/{questionId}` | INSTRUCTOR |
| POST | `/api/v1/instructor/courses/questions/{questionId}/options` | INSTRUCTOR |
| PUT | `/api/v1/instructor/courses/options/{optionId}` | INSTRUCTOR |
| DELETE | `/api/v1/instructor/courses/options/{optionId}` | INSTRUCTOR |
| GET | `/api/v1/courses` | Public (catalog, published courses) |
| GET | `/api/v1/courses/{courseId}` | Public (catalog detail) |
| POST | `/api/v1/courses/{courseId}/enroll` | Authenticated (learner; drafts blocked) |
| GET | `/api/v1/learner/enrollments` | Authenticated |
| GET | `/api/v1/learner/enrollments/{courseId}` | Authenticated |
| PATCH | `/api/v1/lessons/{lessonId}/progress` | Authenticated |
| GET | `/api/v1/lessons/course/{courseId}/progress` | Authenticated |
| GET | `/api/v1/wishlist` | Authenticated |
| POST | `/api/v1/wishlist/course/{courseId}` | Authenticated |
| DELETE | `/api/v1/wishlist/course/{courseId}` | Authenticated |

Swagger UI: `http://localhost:8080/swagger-ui/index.html`

## Branching & Commit Conventions

Branch prefixes: `feat/`, `fix/`, `docs/`, `chore/`, `refactor/`, `test/`

Commit format: `type: short description` (e.g., `feat: implement enrollment endpoint`)

**Design specs (required reading order before any frontend UI work):**
1. `PRODUCT.md` — product purpose, user profiles, brand personality, and design principles
2. `DESIGN.md` — canonical design system: all tokens, colors, typography, spacing, shadows, radii, and components. This is the single source of truth.
3. `docs/design/page-specs/<page>.md` — the page-specific layout and component spec for the surface being built

For the landing page, use `docs/design/final-specs/landing-page.md` as the page spec.

Never invent new colors, spacing, or component variants. `docs/design/final-specs/design-system.md` is a pointer index only, not a token source.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- `graphify-out/` is a generated local artifact and is git-ignored. Do not commit it.

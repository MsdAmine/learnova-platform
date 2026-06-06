# Graph Report - Gestion-Formation-LMS  (2026-06-06)

## Corpus Check
- 163 files · ~273,038 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1281 nodes · 1669 edges · 122 communities (113 shown, 9 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0e23c307`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 91|Community 91]]
- [[_COMMUNITY_Community 92|Community 92]]
- [[_COMMUNITY_Community 93|Community 93]]
- [[_COMMUNITY_Community 94|Community 94]]
- [[_COMMUNITY_Community 95|Community 95]]
- [[_COMMUNITY_Community 96|Community 96]]
- [[_COMMUNITY_Community 97|Community 97]]
- [[_COMMUNITY_Community 104|Community 104]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 47 edges
2. `colorMeta` - 18 edges
3. `Main Features` - 18 edges
4. `compilerOptions` - 17 edges
5. `compilerOptions` - 16 edges
6. `2. Token Mapping` - 16 edges
7. `API Overview` - 16 edges
8. `Learnova Landing Page — Final Specification` - 16 edges
9. `useAuth()` - 15 edges
10. `Backend Modules` - 14 edges

## Surprising Connections (you probably didn't know these)
- `User` --references--> `ProfileType`  [EXTRACTED]
  frontend/src/api/auth.ts → frontend/src/types/profile.ts
- `NotStartedCourseCard()` --calls--> `cn()`  [EXTRACTED]
  frontend/src/components/dashboard/CourseCard.tsx → frontend/src/lib/cn.ts
- `RegisterPage()` --calls--> `useAuth()`  [EXTRACTED]
  frontend/src/features/auth/pages/RegisterPage.tsx → frontend/src/context/AuthContext.tsx
- `FeaturedCourseRow()` --calls--> `cn()`  [EXTRACTED]
  frontend/src/features/dashboard/pages/LearnerDashboard.tsx → frontend/src/lib/cn.ts
- `InProgressCourseCard()` --calls--> `cn()`  [EXTRACTED]
  frontend/src/features/dashboard/pages/LearnerDashboard.tsx → frontend/src/lib/cn.ts

## Import Cycles
- None detected.

## Communities (122 total, 9 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (20): Override, String, User, Override, String, Transactional, UserDetails, Override (+12 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (29): CurrentUserResponse, CustomUserDetails, LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, Role, RoleName (+21 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (43): displayName, displayName, purpose, purpose, displayName, purpose, displayName, purpose (+35 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (38): 0. Page-level rules, 10. Performance Budget, 11. SEO, 12. Implementation Checklist for Claude Code, 13. Out of Scope (v1), 14. Open Questions (resolve before implementation), 1. Navbar, 2. Hero Section (+30 more)

### Community 4 - "Community 4"
Cohesion: 0.05
Nodes (37): 10. Live Sessions with Instructors, 11. Notifications, 12. Discussion and Q&A, 13. Reviews and Ratings, 14. Dashboards, 15. Search and Filtering, 16. Recommendation System, 17. Content Moderation (+29 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (35): dependencies, axios, clsx, lucide-react, @radix-ui/react-slot, react, react-dom, react-router-dom (+27 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (16): BrandIntro(), FinalCta(), Footer(), NAV_COLUMNS, SOCIAL_LINKS, Hero(), NAV_LINKS, Navbar() (+8 more)

### Community 7 - "Community 7"
Cohesion: 0.08
Nodes (25): 1. Overview, 2. Colors: The Forest and the Field, 3. Typography, 4. Elevation, 5. Components, 6. Do's and Don'ts, Buttons, Cards / Containers (+17 more)

### Community 8 - "Community 8"
Cohesion: 0.14
Nodes (13): AuthRegistrationIntegrationTest, AuthenticationConfiguration, AuthenticationManager, AuthenticationProvider, Bean, Bean, Test, CorsConfigurationSource (+5 more)

### Community 9 - "Community 9"
Cohesion: 0.17
Nodes (14): Course, List, Long, String, Course, CourseRequest, CourseResponse, CourseUpdateRequest (+6 more)

### Community 10 - "Community 10"
Cohesion: 0.16
Nodes (10): InstructorProfile, List, Long, Optional, InstructorProfileRequest, String, Test, InstructorApprovalStatus (+2 more)

### Community 11 - "Community 11"
Cohesion: 0.10
Nodes (14): cn(), Badge(), BadgeProps, BadgeVariant, variantClasses, Card(), CardContent(), CardDescription() (+6 more)

### Community 12 - "Community 12"
Cohesion: 0.13
Nodes (18): AuthLayout, CertificatesPage, DashboardLayout, LandingPage, LearnerDashboard, LiveSessionsPage, LoginPage, MyCoursesPage (+10 more)

### Community 13 - "Community 13"
Cohesion: 0.22
Nodes (12): CustomUserDetails, InstructorProfile, InstructorProfileRejectionRequest, InstructorProfileRequest, InstructorProfileResponse, List, Long, Role (+4 more)

### Community 14 - "Community 14"
Cohesion: 0.20
Nodes (9): Set, User, CustomUserDetails, ProfileSwitchRequest, ProfileSwitchResponse, Transactional, ProfileType, ProfileAccessService (+1 more)

### Community 15 - "Community 15"
Cohesion: 0.11
Nodes (18): Accessibility, Anzac, Azure, Background, Borders, Brand Personality, Coral, Error (+10 more)

### Community 16 - "Community 16"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 17 - "Community 17"
Cohesion: 0.11
Nodes (17): Body Text, Button Typography, Default Body, Design Rules, H1, H2, H3, H4 (+9 more)

### Community 18 - "Community 18"
Cohesion: 0.11
Nodes (17): Branching Strategy, Code Organization, Commit Convention, Common types:, Contributing Guide, Documentation, Documentation branches:, Examples: (+9 more)

### Community 19 - "Community 19"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 20 - "Community 20"
Cohesion: 0.17
Nodes (10): twMerge, Avatar(), AvatarProps, AvatarSize, getInitials(), PALETTE, paletteFor(), SIZES (+2 more)

### Community 21 - "Community 21"
Cohesion: 0.12
Nodes (16): Admin, API Documentation, API Overview, Authentication, Certificates, Discussion, Instructor Courses, Learner Enrollment (+8 more)

### Community 22 - "Community 22"
Cohesion: 0.23
Nodes (9): String, CategoryRequest, CategoryResponse, List, Long, Transactional, Category, CategoryRepository (+1 more)

### Community 23 - "Community 23"
Cohesion: 0.12
Nodes (13): String, Override, Optional, Role, RoleName, Long, String, Test (+5 more)

### Community 24 - "Community 24"
Cohesion: 0.15
Nodes (13): LoginResult, loginUser(), registerUser(), User, LoginAction, LoginState, RegisterAction, RegisterPage() (+5 more)

### Community 25 - "Community 25"
Cohesion: 0.12
Nodes (15): Backend:, Confirmed Architecture, Confirmed Core Features, Current Milestone, Current Status, First Implementation Priority, Frontend:, Key Domain Rule (+7 more)

### Community 26 - "Community 26"
Cohesion: 0.22
Nodes (9): GuestRoute(), ProtectedRoute(), DashboardLayout(), getInitials(), NAV_ITEMS, useAuth(), useCurrentUser(), LearnerDashboard() (+1 more)

### Community 27 - "Community 27"
Cohesion: 0.13
Nodes (14): Admin Module, Auth Module, Backend Modules, Certificate Module, Course Module, Course Structure Module, Discussion Module, Enrollment Module (+6 more)

### Community 28 - "Community 28"
Cohesion: 0.13
Nodes (14): Brand Direction, Branding Rules, Cards, Colors, Components, Dashboard Direction, Layout, Learnova Brand Guidelines (+6 more)

### Community 29 - "Community 29"
Cohesion: 0.09
Nodes (25): Course, CourseCard(), courseGradient(), DEFAULT_GRADIENT, InProgressCourseCard(), NotStartedCourseCard(), FeaturedCourseRow(), Certificate (+17 more)

### Community 30 - "Community 30"
Cohesion: 0.14
Nodes (13): Certificate Model, Core Identity Model, Course Model, Data Model, Discussion Model, Enrollment and Progress Model, Important Design Rule, Live Session Model (+5 more)

### Community 31 - "Community 31"
Cohesion: 0.22
Nodes (10): CurrentUserResponse, CustomUserDetails, GetMapping, LoginRequest, LoginResponse, PostMapping, RegisterRequest, RegisterResponse (+2 more)

### Community 32 - "Community 32"
Cohesion: 0.14
Nodes (12): Active Profile Switching, API Surface (current), Axios Interceptor Setup, Backend Architecture, Backend Commands, Branching & Commit Conventions, Frontend Architecture, Frontend Commands (+4 more)

### Community 33 - "Community 33"
Cohesion: 0.24
Nodes (9): CategoryRequest, CategoryResponse, GetMapping, List, Long, PostMapping, PreAuthorize, ResponseStatus (+1 more)

### Community 34 - "Community 34"
Cohesion: 0.26
Nodes (10): CourseRequest, CourseResponse, CourseUpdateRequest, CustomUserDetails, Long, PostMapping, PreAuthorize, ResponseStatus (+2 more)

### Community 35 - "Community 35"
Cohesion: 0.25
Nodes (6): AuthContext, AuthContextType, AuthProvider(), User, ProfileSwitchResponse, ProfileType

### Community 36 - "Community 36"
Cohesion: 0.29
Nodes (6): Journey(), steps, Cta, JourneyStep(), JourneyStepImage, JourneyStepProps

### Community 37 - "Community 37"
Cohesion: 0.17
Nodes (11): Architecture Style, Backend Responsibilities, Database Responsibilities, Dual-Profile Model, Frontend Responsibilities, Future Scalability, High-Level Architecture, Introduction (+3 more)

### Community 38 - "Community 38"
Cohesion: 0.32
Nodes (8): GetMapping, InstructorProfileRejectionRequest, InstructorProfileResponse, List, Long, PostMapping, PreAuthorize, AdminInstructorProfileController

### Community 39 - "Community 39"
Cohesion: 0.18
Nodes (10): ADR 0003: Use Cloudinary for Media Storage, Consequences, Context, Decision, Future Considerations, Implementation Notes, Negative, Positive (+2 more)

### Community 40 - "Community 40"
Cohesion: 0.18
Nodes (10): ADR 0004: Generate Certificates in the Backend, Consequences, Context, Decision, Future Considerations, Implementation Notes, Negative, Positive (+2 more)

### Community 41 - "Community 41"
Cohesion: 0.38
Nodes (3): AuthLoginIntegrationTest, String, Test

### Community 42 - "Community 42"
Cohesion: 0.31
Nodes (7): CustomUserDetails, GetMapping, InstructorProfileRequest, InstructorProfileResponse, PostMapping, ResponseStatus, InstructorProfileController

### Community 44 - "Community 44"
Cohesion: 0.20
Nodes (9): ADR 0002: Use Jitsi for Live Sessions, Consequences, Context, Decision, Future Considerations, Implementation Notes, Negative, Positive (+1 more)

### Community 45 - "Community 45"
Cohesion: 0.20
Nodes (9): 1. Navbar, 2. Hero Section, 3. Feature Highlights, 4. Learning Journey Sections, 5. Statistics Section, 6. Testimonials, 7. Final CTA, 8. Footer (+1 more)

### Community 46 - "Community 46"
Cohesion: 0.24
Nodes (7): StatsGrid(), LANDING_STATS, LandingStat, Stat(), StatProps, StatSize, valueClass

### Community 47 - "Community 47"
Cohesion: 0.07
Nodes (31): 0. Scope & Assumptions, 1. Layout & Structure, 2. Token Mapping, 3. Component Reusability, 4. Design-Rule Compliance Notes, Content-column wireframe (lg), Course card, Course card — Completed (+23 more)

### Community 48 - "Community 48"
Cohesion: 0.22
Nodes (8): ADR 0001: Use Modular Monolith Architecture, Consequences, Context, Decision, Future Considerations, Negative, Positive, Status

### Community 49 - "Community 49"
Cohesion: 0.16
Nodes (10): SplitImageCardProps, TopImageCardProps, LANDING_TESTIMONIALS, LandingTestimonial, Container(), ContainerProps, ContainerSize, maxWidthClass (+2 more)

### Community 50 - "Community 50"
Cohesion: 0.22
Nodes (8): Accessibility & Inclusion, Anti-references, Brand Personality, Design Principles, Product, Product Purpose, Register, Users

### Community 51 - "Community 51"
Cohesion: 0.39
Nodes (3): CurrentUserIntegrationTest, String, Test

### Community 52 - "Community 52"
Cohesion: 0.43
Nodes (5): CustomUserDetails, PostMapping, ProfileSwitchRequest, ProfileSwitchResponse, ProfileSwitchController

### Community 53 - "Community 53"
Cohesion: 0.43
Nodes (4): LearnerProfile, Long, Optional, LearnerProfileRepository

### Community 54 - "Community 54"
Cohesion: 0.29
Nodes (6): Actors, Admin, External Meeting Provider, Instructor, Learner, System Context Diagram

### Community 55 - "Community 55"
Cohesion: 0.29
Nodes (6): Acceptance Criteria, Description, Expected Behavior, Related Module, Technical Notes, User Story

### Community 56 - "Community 56"
Cohesion: 0.29
Nodes (6): After making React code changes:, Command, Configuring or explaining rules, /doctor — full local triage workflow, For general cleanup or code improvement:, React Doctor

### Community 57 - "Community 57"
Cohesion: 0.33
Nodes (5): Getting Started, Guides, Maven Parent overrides, Read Me First, Reference Documentation

### Community 58 - "Community 58"
Cohesion: 0.33
Nodes (3): PrePersist, PreUpdate, Category

### Community 59 - "Community 59"
Cohesion: 0.33
Nodes (3): PrePersist, PreUpdate, Course

### Community 60 - "Community 60"
Cohesion: 0.33
Nodes (3): PrePersist, PreUpdate, InstructorProfile

### Community 61 - "Community 61"
Cohesion: 0.33
Nodes (3): PrePersist, PreUpdate, LearnerProfile

### Community 62 - "Community 62"
Cohesion: 0.33
Nodes (5): Anti-Patterns Verdict, Design Health Score, Minor Observations, Persona Red Flags, Priority Issues

### Community 63 - "Community 63"
Cohesion: 0.33
Nodes (5): Anti-Patterns Verdict, Design Health Score, Overall Impression, Persona Red Flags, Priority Issues

### Community 64 - "Community 64"
Cohesion: 0.33
Nodes (5): Changes, Checklist, Related Issue, Summary, Testing

### Community 65 - "Community 65"
Cohesion: 0.33
Nodes (6): canonical, displayName, role, tonalRamp, azure, colorMeta

### Community 66 - "Community 66"
Cohesion: 0.40
Nodes (4): Backend Responsibility, Frontend Responsibility, Profile Switching, Reasoning

### Community 68 - "Community 68"
Cohesion: 0.40
Nodes (4): Architecture, Architecture Decisions, Diagrams, Documentation

### Community 69 - "Community 69"
Cohesion: 0.40
Nodes (5): canonical, displayName, role, tonalRamp, anzac

### Community 70 - "Community 70"
Cohesion: 0.40
Nodes (5): canonical, displayName, role, tonalRamp, bg-base

### Community 71 - "Community 71"
Cohesion: 0.40
Nodes (5): canonical, displayName, role, tonalRamp, border-default

### Community 72 - "Community 72"
Cohesion: 0.40
Nodes (5): coral, canonical, displayName, role, tonalRamp

### Community 73 - "Community 73"
Cohesion: 0.40
Nodes (5): error, canonical, displayName, role, tonalRamp

### Community 74 - "Community 74"
Cohesion: 0.40
Nodes (5): info, canonical, displayName, role, tonalRamp

### Community 75 - "Community 75"
Cohesion: 0.40
Nodes (5): salem, canonical, displayName, role, tonalRamp

### Community 76 - "Community 76"
Cohesion: 0.40
Nodes (5): salem-50, canonical, displayName, role, tonalRamp

### Community 77 - "Community 77"
Cohesion: 0.40
Nodes (5): salem-700, canonical, displayName, role, tonalRamp

### Community 78 - "Community 78"
Cohesion: 0.40
Nodes (5): success, canonical, displayName, role, tonalRamp

### Community 79 - "Community 79"
Cohesion: 0.40
Nodes (5): surface, canonical, displayName, role, tonalRamp

### Community 80 - "Community 80"
Cohesion: 0.40
Nodes (5): surface-elevated, canonical, displayName, role, tonalRamp

### Community 81 - "Community 81"
Cohesion: 0.40
Nodes (5): text-muted, canonical, displayName, role, tonalRamp

### Community 82 - "Community 82"
Cohesion: 0.40
Nodes (5): text-primary, canonical, displayName, role, tonalRamp

### Community 83 - "Community 83"
Cohesion: 0.40
Nodes (5): text-secondary, canonical, displayName, role, tonalRamp

### Community 84 - "Community 84"
Cohesion: 0.40
Nodes (5): warning, canonical, displayName, role, tonalRamp

### Community 85 - "Community 85"
Cohesion: 0.40
Nodes (4): Acceptance Criteria, Description, Notes, Scope

### Community 87 - "Community 87"
Cohesion: 0.50
Nodes (3): Backend Setup, PostgreSQL Local Setup, Run Backend

### Community 89 - "Community 89"
Cohesion: 0.50
Nodes (3): Expanding the ESLint configuration, React Compiler, React + TypeScript + Vite

### Community 90 - "Community 90"
Cohesion: 0.20
Nodes (5): AnimState, LOGIN_BENEFITS, REGISTER_STEPS, TransitionAction, TransitionState

### Community 91 - "Community 91"
Cohesion: 0.50
Nodes (3): hooks, PostToolUse, PreToolUse

### Community 92 - "Community 92"
Cohesion: 0.50
Nodes (3): outputStyle, permissions, allow

## Knowledge Gaps
- **616 isolated node(s):** `PostToolUse`, `PreToolUse`, `allow`, `outputStyle`, `schemaVersion` (+611 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `InstructorApprovalStatus` connect `Community 10` to `Community 9`, `Community 13`, `Community 14`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `cn()` connect `Community 11` to `Community 36`, `Community 6`, `Community 12`, `Community 46`, `Community 49`, `Community 20`, `Community 24`, `Community 26`, `Community 29`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `colorMeta` connect `Community 65` to `Community 2`, `Community 69`, `Community 70`, `Community 71`, `Community 72`, `Community 73`, `Community 74`, `Community 75`, `Community 76`, `Community 77`, `Community 78`, `Community 79`, `Community 80`, `Community 81`, `Community 82`, `Community 83`, `Community 84`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **What connects `PostToolUse`, `PreToolUse`, `allow` to the rest of the system?**
  _616 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.09176788124156546 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06009783368273934 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.045454545454545456 - nodes in this community are weakly interconnected._
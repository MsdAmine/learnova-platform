# Profile Switching

Learnova supports a dual-profile model.

A registered user receives a learner profile by default. The same user may request instructor access. After admin approval, the user receives instructor access and can switch between learner mode and instructor mode in the frontend.

## Backend Responsibility

The backend is responsible for validating which profiles are available to the authenticated user.

A learner profile is available when:

- the user has `ROLE_LEARNER`
- the user has a learner profile record

An instructor profile is available when:

- the user has `ROLE_INSTRUCTOR`
- the user has an instructor profile record
- the instructor profile has `APPROVED` status

## Frontend Responsibility

The frontend may store the selected active profile locally.

The backend does not persist active profile state in the first version. Instead, it exposes available profiles through:

```text
GET /api/v1/auth/me
```
and validates profile switch requests through:

```text
POST /api/v1/profile/switch
```

## Reasoning
Keeping active profile state on the frontend keeps the backend stateless and avoids unnecessary session persistence. Backend authorization remains role-based and profile-aware.
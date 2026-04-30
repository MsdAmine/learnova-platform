# ADR 0004: Generate Certificates in the Backend

## Status

Proposed

## Context

The Online Training Platform includes a certificate feature that allows learners to receive certificates after completing course requirements.

Certificate generation depends on platform-specific business rules, such as:

- learner enrollment status
- completed lessons
- passed quizzes
- course completion percentage
- course title
- instructor information
- learner identity
- certificate issue date
- unique certificate verification code

Because these rules are part of the platform domain, certificate generation should remain under backend control.

Using a separate certificate generation service would introduce additional dependency and complexity, including:

- external API integration
- third-party service availability
- cost or usage limits
- data privacy concerns
- more complex error handling
- harder testing and local development

For the PFA scope, generating certificates in the backend is simpler, more controllable, and easier to demonstrate.

## Decision

The backend will generate certificates after validating course completion requirements.

The backend will be responsible for:

- checking that the learner is enrolled in the course
- checking that required lessons are completed
- checking that required quizzes are passed
- generating a unique certificate verification code
- creating a certificate record in PostgreSQL
- generating a certificate document or certificate view
- storing the generated file URL if a PDF is produced
- exposing a public verification endpoint

The first version may generate:

- a downloadable PDF certificate
- or a certificate record with a verification page
- or a simple certificate document placeholder suitable for later PDF generation

If Cloudinary or another media storage provider is configured, generated certificate files may be uploaded and the resulting URL stored in the database.

## Consequences

### Positive

- Certificate generation remains aligned with platform business rules
- No dependency on a third-party certificate service
- Easier to test locally
- Easier to demonstrate during PFA defense
- Verification logic remains inside the platform
- More control over certificate layout and data
- Lower operational complexity

### Negative

- Backend becomes responsible for document generation
- PDF generation may add an extra library dependency
- Certificate design/layout must be maintained by the project
- File storage must be handled if PDFs are generated
- More backend logic is required compared to storing only certificate records

## Implementation Notes

A certificate should include:

- certificate code
- learner name
- course title
- instructor name
- issue date
- platform name
- verification URL or verification code

Suggested certificate flow:

1. Learner requests certificate generation
2. Backend checks authentication
3. Backend verifies learner enrollment
4. Backend checks course completion requirements
5. Backend checks that certificate does not already exist
6. Backend generates unique certificate code
7. Backend creates certificate record
8. Backend generates certificate PDF or certificate view
9. Backend stores file URL if applicable
10. Backend returns certificate response

Suggested certificate table fields:

```text
certificates
- id
- learner_profile_id
- course_id
- certificate_code
- pdf_url
- issued_at
```

Suggested API endpoints:

- `POST /api/v1/learner/courses/{courseId}/certificate`
- `GET /api/v1/learner/certificates`
- `GET /api/v1/certificates/verify/{code}`

## Verification Strategy

The platform should expose a public certificate verification endpoint.

The verification response should include only safe public information, such as:

- certificate code
- learner display name
- course title
- instructor name
- issue date
- validity status

Sensitive data such as learner email, internal IDs, or private profile data should not be exposed.

## Future Considerations

Possible future improvements include:

- generating polished PDF certificates
- adding QR codes to certificates
- adding digital signatures
- storing generated PDFs in Cloudinary
- adding certificate revocation
- adding downloadable certificate previews
- adding multilingual certificate templates

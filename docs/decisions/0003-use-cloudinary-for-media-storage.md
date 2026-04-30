# ADR 0003: Use Cloudinary for Media Storage

## Status

Proposed

## Context

The Online Training Platform requires file and media storage for several features, including:

- course thumbnails
- instructor profile images
- learner profile images
- lesson attachments
- PDF resources
- certificate files
- possible video thumbnails or external media references

During local development, storing files on the local filesystem is simple. However, local storage becomes problematic when the application is deployed because:

- uploaded files may be lost when containers restart
- multiple deployment instances cannot share local files easily
- file URLs may not be publicly accessible
- backups and media delivery become harder to manage
- deployment platforms may provide temporary or read-only filesystems

Because the project is intended to be deployed, media storage should be separated from the backend application runtime.

## Decision

The project will use Cloudinary as the proposed media storage provider.

Cloudinary may be used to store and serve:

- course thumbnails
- profile images
- lesson attachments where appropriate
- generated certificate PDFs if supported by the final implementation

The backend will remain responsible for:

- validating uploaded files
- sending files to Cloudinary
- storing returned URLs or public identifiers in PostgreSQL
- deleting or replacing media when needed
- enforcing authorization before upload or deletion

Cloudinary will be responsible for:

- file hosting
- public media delivery
- image optimization where applicable
- stable media URLs

## Consequences

### Positive

- Uploaded media survives backend restarts and redeployments
- Media storage is separated from application runtime
- Public media URLs are easier to use from the frontend
- Useful for deployed environments
- Reduces the need to manage local file serving
- Supports image optimization and transformations if needed later

### Negative

- Adds dependency on an external service
- Requires API credentials and secure secret management
- Free-tier limits may apply
- Upload and deletion failures must be handled safely
- Tests need to avoid calling the real external service directly
- Some file types may require additional configuration depending on Cloudinary settings

## Implementation Notes

The backend should define an abstraction for media storage instead of calling Cloudinary directly from controllers.

Recommended interface:

```text
MediaStorageService
- upload(file, folder)
- delete(publicId)
- getUrl(publicId)
```

Possible implementations:

- LocalMediaStorageService
- CloudinaryMediaStorageService

Recommended approach:

- use local storage for early development if needed
- use Cloudinary for deployed environments
- keep provider-specific logic inside the infrastructure/service layer
- store only URLs or provider identifiers in the database
- never commit Cloudinary credentials to the repository

Required environment variables may include:

- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET

## Security Considerations

The project must avoid committing real credentials.

The repository should include only placeholder values in environment example files.

Uploaded files should be validated before storage, including:

- file size
- allowed content types
- allowed extensions
- ownership and authorization checks

## Future Considerations

Possible future improvements include:

- switching to S3-compatible storage
- using MinIO for local object storage
- adding virus scanning for uploaded files
- using signed URLs for private files
- separating public media from private course resources
- adding background cleanup for unused files

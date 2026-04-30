# ADR 0002: Use Jitsi for Live Sessions

## Status

Accepted

## Context

The Online Training Platform includes an advanced live session feature that allows instructors to schedule group calls with learners.

A custom video conferencing implementation would require complex real-time infrastructure, including:

- WebRTC signaling
- STUN/TURN server configuration
- Room management
- Media stream handling
- Participant state synchronization
- Bandwidth and connection management
- Browser permission handling
- Real-time failure handling

This complexity is not justified for the current PFA scope.

The platform needs live sessions, but the core responsibility of the application should remain:

- scheduling sessions
- linking sessions to courses
- controlling access based on enrollment
- recording attendance
- notifying learners
- providing a clean join flow

The platform should not be responsible for transmitting or processing audio/video streams.

## Decision

The platform will use Jitsi Meet for live sessions.

The backend will manage:

- live session creation
- live session scheduling
- course ownership validation
- learner enrollment validation
- meeting URL generation or storage
- session status
- attendance tracking

Jitsi will manage:

- video calls
- audio calls
- screen sharing
- real-time participant communication
- browser media permissions

The first implementation may support both:

- generated Jitsi meeting URLs
- manually provided external meeting links

## Consequences

### Positive

- Avoids implementing custom video infrastructure
- Reduces technical risk
- Keeps the project realistic for PFA scope
- Allows live session functionality to be demonstrated clearly
- Keeps backend focused on business logic
- Makes the feature easier to test and maintain
- Allows future replacement with another provider if needed

### Negative

- The platform depends on an external meeting provider
- Advanced meeting control is limited compared to a custom implementation
- Some participant behavior may not be fully controlled by the platform
- Jitsi room security must be handled carefully
- Meeting availability depends on the external provider

## Implementation Notes

A live session should store:

- course reference
- instructor profile reference
- title
- description
- start time
- end time
- meeting provider
- meeting URL
- maximum participants
- session status

The backend should return the meeting URL only after validating that the learner is enrolled in the related course.

Suggested join flow:

1. Learner clicks join session
2. Backend checks authentication
3. Backend checks learner enrollment
4. Backend checks session status
5. Backend records attendance
6. Backend returns the Jitsi meeting URL
7. Frontend redirects to or embeds the meeting room

## Future Considerations

Possible future improvements include:

- using the Jitsi iframe API
- generating more secure room names
- adding meeting passwords or access tokens if supported
- embedding Jitsi directly inside the platform UI
- adding attendance duration tracking
- adding reminders before live sessions
- replacing Jitsi with another provider if project requirements change
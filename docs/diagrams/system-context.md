# System Context Diagram

```text
+--------------------+
|      Learner       |
+---------+----------+
          |
          | uses
          v
+--------------------+        +----------------------+
|                    |        |                      |
| Online Training    |------->| External Meeting     |
| Platform           |        | Provider             |
|                    |        | Jitsi / Meet / Zoom  |
+---------+----------+        +----------------------+
          ^
          | uses
+---------+----------+
|     Instructor     |
+--------------------+

+--------------------+
|       Admin        |
+---------+----------+
          |
          | manages
          v
+--------------------+
| Online Training    |
| Platform           |
+--------------------+
```

## Actors

### Learner

A learner uses the platform to:

- Browse courses
- Enroll in courses
- Watch lessons
- Track progress
- Take quizzes
- Join live sessions
- Receive certificates

### Instructor

An instructor uses the platform to:

- Create courses
- Add sections and lessons
- Create quizzes
- Schedule live sessions
- Track learner progress
- Answer questions

### Admin

An admin uses the platform to:

- Manage users
- Approve instructors
- Manage categories
- Moderate content
- Monitor platform activity

### External Meeting Provider

The meeting provider is used for live sessions.

The platform manages access control and attendance, while the external provider manages video communication.

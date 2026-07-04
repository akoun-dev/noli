---
Task ID: 3
Agent: Notification API Agent
Task: Create notification system API routes and server-side helper

Work Log:
- Read worklog.md and studied existing API route conventions (import patterns, params typing, French error messages, no NextAuth — custom auth only)
- Confirmed Notification model exists in Prisma schema with fields: id, userId, type, title, message, link, isRead, createdAt
- Confirmed project has no `getServerSession` — uses custom auth, so no auth import needed
- Created `/src/lib/notifications.ts` — server-side helper with `CreateNotificationParams` interface and `createNotification()` function
- Created `/src/app/api/notifications/route.ts` — GET (list with userId required, unreadOnly filter, take 50, order desc) + POST (delegates to createNotification helper, returns 201)
- Created `/src/app/api/notifications/[id]/route.ts` — PUT (validates notification exists, validates isRead is boolean, updates)
- Created `/src/app/api/notifications/read-all/route.ts` — PUT (requires userId query param, uses updateMany on unread only, returns count)
- Ran lint: only pre-existing launch-server.js errors, zero new issues
- Verified dev log: no compilation errors

Stage Summary:
- 4 files created, all TypeScript, all French error messages, no console.log
- GET /api/notifications?userId=xxx&unreadOnly=true — fetches last 50 notifications
- POST /api/notifications — creates notification via helper
- PUT /api/notifications/[id] — marks single notification read/unread
- PUT /api/notifications/read-all?userId=xxx — marks all unread as read
- Helper at src/lib/notifications.ts can be imported by any server-side code to create notifications programmatically
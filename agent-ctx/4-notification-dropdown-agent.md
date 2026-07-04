---
Task ID: 4
Agent: Main Agent
Task: Create reusable NotificationDropdown shared component

Work Log:
- Created `/home/z/my-project/src/components/shared/notification-dropdown.tsx`
- Component receives `userId: string` prop
- On mount, fetches notifications via `GET /api/notifications?userId={userId}`
- Bell icon button with red badge showing unread count (hidden when count is 0, caps at 99+)
- Popover (shadcn/ui) with:
  - Header: "Notifications" title + "Tout marquer comme lu" button (PUT read-all)
  - Loading state: centered spinner
  - Empty state: bell icon + "Aucune notification"
  - Scrollable list (max-h-80) with colored left border by type, title, truncated message, French relative time, unread dot indicator
  - Click notification: marks read (PUT /api/notifications/{id}), navigates if link present, closes popover on navigation
- Brand-colored unread dot (#B9E54D)
- Uses shadcn/ui Button, Popover, PopoverContent, PopoverTrigger
- Uses Lucide Bell, CheckCheck, Loader2
- Uses useToast for error feedback
- Named export: `NotificationDropdown`
- Lint clean (only pre-existing launch-server.js warnings)
- Dev server compiles successfully

Stage Summary:
- Reusable `NotificationDropdown` component created at `src/components/shared/notification-dropdown.tsx`
- Ready to be imported in admin, insurer, and user layouts via: `import { NotificationDropdown } from "@/components/shared/notification-dropdown"`
- Usage: `<NotificationDropdown userId={user.id} />`
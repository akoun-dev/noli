---
Task ID: 4
Agent: Settings Tab Agent
Task: Rewrite settings-tab.tsx with 7 sub-tabs + backend APIs

Work Log:
- Read existing settings-tab.tsx (2 tabs: Profils, Configuration) and worklog.md for project context
- Read Prisma schema to understand SystemSetting and Role models
- Wrote complete `src/components/admin/settings-tab.tsx` with 7 sub-tabs:
  1. **Général** – site name, email, maintenance mode with warning banner
  2. **Email (SMTP)** – SMTP settings, encryption select, test email button
  3. **Utilisateurs** – preserved existing profile table with search, mobile cards, edit dialog
  4. **Sécurité** – password policy (length, uppercase, lowercase, numbers, special), lockout, session expiry
  5. **Notifications** – channels (Email/SMS/Push), events (devis, signup, status, system alerts)
  6. **Apparence** – theme (uses useTheme from next-themes), language, date format, timezone
  7. **Gestion des comptes** – enhanced profile table with role badges, status badges, last login, expandable rows with permissions/roles/activity summary, quick actions (activate/deactivate, role change)
- Created `src/app/api/admin/settings/route.ts` – GET returns settings grouped by category (auto-seeds 25 default settings), PUT upserts a single setting by key
- Created `src/app/api/admin/roles/route.ts` – GET returns roles with permissions, auto-seeds 3 default roles (ADMIN, INSURER, USER)
- All tabs use named export `export function SettingsTab()`, "use client", shadcn/ui components
- Brand colors: `bg-[#B9E54D] text-black hover:bg-[#a5d044]` for save buttons
- Responsive: mobile cards for tabs 3 & 7, horizontally scrollable tab list, `max-w-2xl` for forms
- Lint clean (only pre-existing launch-server.js warnings)
- Dev log shows no compilation errors

Stage Summary:
- Settings tab completely rewritten with 7 functional sub-tabs
- Backend APIs created for settings and roles with auto-seeding
- All text in French, dark mode compatible, responsive design
- Existing profile management functionality preserved and enhanced
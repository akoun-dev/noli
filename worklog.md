---
Task ID: 1
Agent: Main Agent
Task: Fix admin interface bugs and enhance features

Work Log:
- Fixed missing `Separator` import in `insurance-offers-tab.tsx`
- Fixed JSX parsing error in `dashboard-tab.tsx` (missing `</TableCell>`, missing `</div>`)
- Fixed JSX parsing error in `devis-tab.tsx` (missing `)` for `.map()`, missing `<TableHead>` opening tags, broken `Select` structure, missing `</div>` tags)
- Fixed JSX parsing error in `settings-tab.tsx` (missing `</TableCell>`, unclosed `<Button>`)
- Rewrote `devis-tab.tsx` completely with proper structure, status management, and detail dialog
- Enhanced `insurance-offers-tab.tsx` with comprehensive detail dialog showing: stat cards, info grid, description, features, and insurer's coverages grouped by category
- Fixed `stats/route.ts` API to return proper field names (`totalInsurers`, `activeInsurers`, `recentQuotes`, etc.) instead of flat structure
- Added null-safety in dashboard-tab for `recentQuotes`
- Fixed `settings-tab.tsx` null reference error (Dialog content accessing `edit.firstName` when `edit` is null)
- Browser-verified all 9 admin tabs load without errors

Stage Summary:
- All admin tabs verified working: Tableau de bord, Assureurs, Catégories Produits, Offres, Cat. Garanties, Garanties, Packages, Devis, Paramètres
- Insurer detail view shows: 3 stat cards (Offres/Garanties/Comptes), contact info, offers list, guarantees list grouped by category
- Offer detail view shows: stat cards, info grid (assureur, type, prix, franchise, capital, catégorie, date), description, characteristics, coverages grouped by category (17 for SAHAM)
- Coverage categories CRUD functional (12 categories seeded)
- Settings tab with user profiles management + configuration panel
- Lint passes (only pre-existing launch-server.js warnings remain)---
Task ID: 1
Agent: Main Agent
Task: Remove "Packages" menu from admin interface

Work Log:
- Removed PackagesTab import from admin-page.tsx
- Removed Package icon import from lucide-react
- Removed "packages" entry from sidebarItems array
- Removed "packages" case from renderTab switch
- Deleted src/components/admin/packages-tab.tsx
- Ran lint check (only pre-existing errors in launch-server.js)
- Browser verified: admin loads with 8 menu items (no Packages), all tabs functional

Stage Summary:
- Packages menu completely removed from admin interface
- Sidebar now shows: Tableau de bord, Assureurs, Catégories Produits, Offres, Cat. Garanties, Garanties, Devis, Paramètres
- API routes for insurance-packages remain intact (DB model preserved)
- All existing features verified working via browser
---
Task ID: 3
Agent: Main Agent
Task: Show linked offers on insurer selection in offer creation form + w-full responsive fields

Work Log:
- Added `InsurerOfferPreview` interface and state (`insurerOffers`, `insurerOffersLoading`) to track existing offers for the selected insurer in the form
- Added `useEffect` that fetches `/api/admin/insurance-offers?insurerId={id}` whenever `form.insurerId` changes
- Replaced the insurer dropdown section with: dropdown + a scrollable list showing all linked offers (name, contract type badge, price, status)
- Converted all form fields from grid layout (`grid-cols-2`, `grid-cols-3`) to stacked vertical layout with `w-full` on each field
- Widened dialog to `sm:max-w-xl` to better accommodate the offers list
- Browser verified on desktop: SAHAM Assurances selected → "Offres de cet assureur (3)" shows Sérénité, Équilibre, Économique with badges and prices
- Browser verified on mobile (375px): Cards properly responsive, buttons touch-friendly

Stage Summary:
- Form now displays a clean list of existing insurer offers (name + type badge + price) when an insurer is selected
- All form fields are `w-full` and vertically stacked for full responsiveness
- No more JSON display — offers shown as formatted list items
---
Task ID: 4
Agent: Main Agent
Task: Fix POST /api/compare 500 Internal Server Error

Work Log:
- Identified root cause: `db.offer.findMany()` — Prisma model is `insuranceOffer` not `offer`
- Fixed all incorrect field references: `basePrice` → `priceMin`, `insurer.logo` → `insurer.logoUrl`, `insurer.rating` → default 4.0, `maxCoverage` → `coverageAmount`, `conditions` → null
- Added `contractTypeMap` to translate internal coverage types (`tiers` → `basic`, `tiers_plus` → `third_party_plus`, `tous_risques` → `all_risks`)
- Fixed `db.quote.create` to match actual Prisma Quote schema (fields: reference, userId, categoryId, status, personalData, vehicleData, coverageRequirements, estimatedPrice)
- Added safe JSON.parse for features field
- Verified via curl: API returns 5 Tiers+ offers with correct pricing for RC+Incendie+Vol selection
- Browser verified full flow: 3-step form → 5 offres trouvées → results displayed with prices in FCFA, insurer filters, guarantee badges

Stage Summary:
- `/api/compare` route now correctly queries `db.insuranceOffer` with proper `contractType` filtering
- Full comparison flow works end-to-end: form submission → API → results page with filters
---
Task ID: 5
Agent: Main Agent
Task: Fix theme dark mode + Fix auth system + Create test accounts

Work Log:
- Investigated theme: CSS variables correctly defined in :root/.dark, @custom-variant dark works
- Found root cause: 6 hardcoded `bg-[#E8F4F0]` in landing, about, contact pages not responding to dark mode
- Added `dark:bg-[#121e19]` to all affected sections + decorative blur elements
- Investigated auth: `db.user` doesn't exist (model is `Profile`), no `password` field, plain-text passwords, response format mismatch
- Added `password String` field to Prisma Profile model + pushed to DB
- Rewrote `/api/auth/route.ts`: `db.profile`, bcryptjs hashing, `firstName`/`lastName` split from `name`, correct `{ user: { ... } }` response format matching client expectations, forgot password handler
- Created 3 test accounts via API:
  - admin@noli.ci / Admin@2025 (role: ADMIN)
  - user@test.ci / User@2025 (role: USER)
  - assureur@saham.ci / Assureur@2025 (role: INSURER)
- Updated seed route to include test accounts for fresh installs
- Browser verified: dark mode hero + testimonials sections now properly dark
- Browser verified: login with admin@noli.ci → shows "AN" avatar menu with Tableau de bord, Mon profil, Déconnexion

Stage Summary:
- Theme dark mode fixed on landing, about, and contact pages
- Auth system fully functional: register, login (bcrypt), forgot password
- 3 test accounts created and verified
- Lint clean (only pre-existing launch-server.js warnings)
---
Task ID: 6
Agent: Main Agent
Task: Convert auth modals to full-page views + fix remaining theme issues

Work Log:
- Added `"login" | "register" | "forgot"` to `AppView` type in `src/types/index.ts`
- Created `src/components/auth/auth-pages.tsx` with full-page Login, Register, and ForgotPassword components (no Dialog wrapper)
- Each auth page has: icon header, form with validation, password strength indicator (register), navigation links between pages, "Retour à l'accueil" link
- Auth pages render with their own minimal header (logo only) and footer — no main Header/Footer
- Updated `src/app/page.tsx`: added `isFullPage()` helper to hide Header/Footer for auth views, imported `AuthPages` instead of `AuthModals`, added auth cases to switch
- Updated `src/components/layout/header.tsx`: replaced `setAuthModal("login"/"register")` with `setView("login"/"register")` in both desktop and mobile menus, removed `setAuthModal` from destructuring
- Updated `src/components/dashboard/dashboard-page.tsx`: replaced `setAuthModal` with `setView` in the not-logged-in state
- Fixed theme: replaced all `bg-white` with `bg-card` in `results-page.tsx` (comparison table rows, insurer chips) and `landing-page.tsx` (insurance category cards) for proper dark mode support
- Verified test accounts exist: admin@noli.ci, user@test.ci, assureur@saham.ci
- Browser verified: login page renders as full page (not modal), login flow works (admin@noli.ci → "AN" avatar), register page with all fields, forgot password page, navigation between pages, mobile responsive auth, dark mode toggle works

Stage Summary:
- Auth system completely converted from modal-based to page-based navigation
- 3 auth pages (Connexion, Inscription, Mot de passe oublié) render as full-screen views
- Theme fixed: no more `bg-white` hardcoded colors breaking dark mode
- Lint clean (only pre-existing launch-server.js warnings)
- All auth flows verified end-to-end on desktop and mobile
---
Task ID: 7
Agent: Full-Stack Developer
Task: Redesign results page with summary panels, new card layout, and inline details

Work Log:
- Read full current results-page.tsx (1195 lines) to understand existing structure
- Added SummaryPanels component: 2-column grid with "Offres les moins chères" (sorted by price asc, top 3) and "Assureurs les mieux notés" (sorted by rating desc, top 3), each with icon header (TrendingDown/Star + Info), insurer logo/shield, name, coverage type, price right-aligned, "dossier inclus" subtitle. Responsive: stacks vertically on mobile.
- Redesigned OfferCard to 3-column horizontal layout:
  - Left section (lg:w-56): insurer logo/shield icon, bold insurer name, coverage type badge
  - Center section (flex-1): "Garanties inclues" heading, separator, checkmark feature list (first 4), franchise info below
  - Right section (lg:w-64): "À partir de" label, big annual price, monthly equivalent, 3 stacked buttons (Obtenir le devis in accent, Être rappelé outline, Comparer outline with Plus/Check toggle)
  - Heart icon in top-right corner (visual only)
  - Mobile: stacks vertically with border dividers
- Replaced OfferDetailDialog with inline expandable section: "En savoir plus sur cette offre" button with ChevronDown/Up, AnimatePresence expand/collapse showing description, all features in grid, maxCoverage, conditions, and "Obtenir le devis" CTA
- Removed OfferDetailDialog component entirely
- Removed selectedOffer/setSelectedOffer from store destructuring (no longer needed)
- Removed Dialog imports used only by OfferDetailDialog (kept Dialog imports for ComparisonModal)
- Added Heart, TrendingDown, Star to lucide-react imports
- Removed priceMode prop from OfferCard (annual price always shown in new layout)
- Preserved all unchanged components: StarRating, FiltersSidebar, ComparisonBar, ComparisonModal, EmptyResultsState
- Preserved all helper functions: formatFCFA, coverageBadgeStyle, COVERAGE_OPTIONS, MAX_COMPARE
- Preserved all main component logic: filters, sorting, comparison handlers, quote request

Stage Summary:
- Results page redesigned with 3-column horizontal offer cards and summary panels
- Summary panels show cheapest and best-rated offers at a glance
- Offer details now expand inline below each card (no more dialog)
- OfferDetailDialog removed, reducing bundle size
- Heart/favorite icon added to cards (visual placeholder)
- All text in French, FCFA formatting, responsive layout (mobile stacks vertically)
- Lint clean (only pre-existing launch-server.js errors)
- Dev server compiles successfully
---
Task ID: 7b
Agent: Main Agent
Task: Fix Être rappelé button handler + browser verification

Work Log:
- Added `onRequestCall` prop to OfferCard component and `handleRequestCall` function in main component
- `handleRequestCall` shows toast: "Demande de rappel envoyée" with insurer name and offer name
- Passed `onRequestCall={handleRequestCall}` to all OfferCard instances
- Browser verified: summary panels render (Offres les moins chères + Assureurs les mieux notés), 3-column card layout with 3 buttons (Obtenir le devis, Être rappelé, Comparer), inline "En savoir plus" dropdown expands with details, responsive layout

Stage Summary:
- All 3 card buttons now functional (devis, rappel, compare)
- Full results page verified via VLM screenshot analysis
- Lint clean
---
Task ID: 8
Agent: Full-Stack Developer
Task: Simplify offer creation form - remove fields, add guarantee checkboxes

Work Log:
- Added `Checkbox` import from shadcn/ui
- Removed `InsurerOfferPreview` interface (no longer needed)
- Updated `empty` form object: removed `contractType`, `priceMin`, `priceMax`, `coverageAmount` fields
- Replaced `insurerOffers`/`insurerOffersLoading` state with `formCoverages`/`formCoveragesLoading` state
- Replaced useEffect that fetched insurer offers with one that fetches coverages from `/api/admin/coverages?insurerId=...`
- Updated `openEdit` to not set `contractType`, `priceMin`, `priceMax`, `coverageAmount` in form
- Updated `handleSave` validation: removed `!form.contractType` check, updated error message
- Removed "Type" column from desktop table header and table body
- Removed Type Badge from mobile cards
- Removed "Offres de cet assureur" section from form dialog
- Removed "Type de contrat" Select field from form dialog
- Removed "Prix min (FCFA)" and "Prix max (FCFA)" fields from form dialog
- Removed "Capital garanti (FCFA)" field from form dialog
- Replaced "Caractéristiques (JSON)" Textarea with guarantee checkboxes: fetches coverages when insurer selected, groups by `category?.name || "Autre"`, uses Checkbox+Label, shows "Obligatoire" badge for mandatory coverages, stores selected names as JSON string array in `form.features`
- Styled checkbox section: `border rounded-lg max-h-64 overflow-y-auto p-3 space-y-3`
- Added loading, empty, and no-insurer-selected states for checkboxes
- Lint clean (only pre-existing launch-server.js errors)
- Dev server compiles successfully

Stage Summary:
- Form simplified to: Assureur, Nom, Description, Franchise, Garanties (checkboxes), Active
- Guarantee checkboxes auto-populate from insurer's coverages, grouped by category
- Pre-checks existing features when editing an offer
- Table and mobile cards no longer show contract type
- All other functionality intact (detail dialog, delete, toggle active, search, filter)
---
Task ID: 9
Agent: Main Agent
Task: Fix auth redirect by role + fix dark mode footer/CTA

Work Log:
- Updated auth-pages.tsx login success: added role-based redirect (ADMIN → admin view, USER/INSURER → landing)
- Updated auth-pages.tsx register success: same role-based redirect
- Investigated dark mode: found toggle works, localStorage persists, CSS variables correct
- Identified root cause: `--primary` and `--accent` swap values in dark mode, causing structural elements (footer, "Pourquoi NOLI" section) to turn lime/yellow
- Fixed footer: added `dark:bg-[#1B464D]` to maintain dark teal in both themes
- Fixed landing page "Pourquoi NOLI" section: added `dark:bg-[#1B464D]` to maintain dark teal
- VLM verified: footer now dark in dark mode (was lime before fix)

Stage Summary:
- Admin users are now redirected to admin panel after login/register
- Dark mode footer and CTA section stay properly dark
- Interactive elements (buttons, badges) correctly swap to lime accent in dark mode
- Lint clean
---
Task ID: 5
Agent: New Admin Tabs Agent
Task: Create 3 new admin tab components (Audit Logs, Backups, Roles) and update admin sidebar

Work Log:
- Created `/src/components/admin/audit-logs-tab.tsx` with:
  - Header with title "Journaux d'audit" and "Exporter les journaux" button (lime brand color)
  - Horizontal responsive filter bar: search input, action Select (9 options), entity Select (8 options), 2 date inputs, "Réinitialiser" button
  - 4 stats cards: Total événements, Connexions aujourd'hui, Modifications, Suppressions
  - Desktop table with columns: Date/Heure, Utilisateur, Action (colored badge), Entité, Détails (expandable JSON), IP
  - Mobile cards with same data in card layout
  - Pagination at bottom with numbered page buttons
  - Empty state "Aucun journal trouvé" with FileText icon
  - Skeleton loading state
  - Action badge colors: LOGIN=green, LOGOUT=gray, CREATE=blue, UPDATE=amber, DELETE=red, EXPORT=purple, SETTINGS_CHANGE=cyan, BACKUP=teal
  - French action labels mapping
  - max-h-[calc(100vh-280px)] with overflow scroll on table area
  - Data fetched from GET /api/admin/audit-logs with query params

- Created `/src/components/admin/backups-tab.tsx` with:
  - Header with title "Sauvegardes" and "Nouvelle sauvegarde" button (lime brand color)
  - 3 stats cards: Dernière sauvegarde (date), Taille totale (formatted), Espace disque (placeholder "2.1 Go")
  - Scheduled backup Card with: Switch toggle, frequency Select (Quotidienne/Hebdomadaire/Mensuelle), time/day inputs, "Prochaine exécution" display, Save button
  - Backup list (desktop table / mobile cards) with columns: Date, Fichier, Taille, Type (badge), Statut (badge with animated icon), Actions
  - Type badges: MANUAL=Manuel gray, SCHEDULED=Planifié amber, AUTO=Auto blue
  - Status badges: COMPLETED=Complété green, FAILED=Échoué red, IN_PROGRESS=En cours amber with spinner
  - Actions: Restaurer (AlertDialog confirm), Télécharger (disabled), Supprimer (AlertDialog destructive confirm)
  - formatFileSize helper (o, Ko, Mo, Go)
  - Empty state "Aucune sauvegarde" with Database icon
  - CRUD API calls: POST/GET/DELETE /api/admin/backups, POST schedule, POST restore
  - Toast notifications and refetch after create/delete/restore

- Created `/src/components/admin/roles-tab.tsx` with:
  - Header with title "Rôles & Permissions" and "Nouveau rôle" button (lime brand color)
  - Desktop: 2-column layout (w-80 roles list + flex-1 permissions panel), both scrollable
  - Mobile: stacked layout with roles list card + permissions card below
  - Roles list: default roles (Lock icon, "Par défaut" badge, no delete), custom roles (edit/delete buttons)
  - Each role card shows: name, description, permission count, user count badge
  - Permissions panel: grouped by 9 categories (Paramètres, Utilisateurs, Offres, Devis, Assureurs, Garanties, Sauvegardes, Audit, Rôles)
  - Each category: Collapsible with checkbox for each permission, "Sélectionner tout" / "Désélectionner tout"
  - "Enregistrer les permissions" button in permissions panel
  - Create/Edit role Dialog with: name input, description textarea, all permission checkboxes (always expanded), Create/Save button
  - Delete role AlertDialog with confirmation
  - Empty state "Aucun rôle personnalisé" with Shield icon
  - CRUD API calls: GET/POST/PUT/DELETE /api/admin/roles, GET /api/admin/permissions

- Updated `/src/components/admin/admin-page.tsx`:
  - Added 3 imports: ClipboardList, Database, UserCog to lucide-react
  - Added 3 tab imports: AuditLogsTab, BackupsTab, RolesTab
  - Added 3 sidebar items before "settings": audit-logs, backups, roles
  - Added 3 cases to renderTab switch

Stage Summary:
- 3 new admin tab components created with full responsive design (desktop table + mobile cards)
- All components use named exports only (no default exports)
- Brand lime color applied to primary buttons: bg-[#B9E54D] text-black hover:bg-[#a5d044]
- All components use bg-card (not bg-white) for dark mode support
- All text in French
- Lint clean (only pre-existing launch-server.js errors remain)
- Dev server compiles successfully
- Admin sidebar now has 11 items: Tableau de bord, Assureurs, Catégories Produits, Offres, Cat. Garanties, Garanties, Devis, Journaux d'audit, Sauvegardes, Rôles & Permissions, Paramètres
---
Task ID: 10
Agent: Main Agent
Task: Complete admin settings system - 7 settings tabs, audit logs, backups, roles & permissions

Work Log:
- Updated Prisma schema with 7 new models: SystemSetting, AuditLog, Backup, Role, Permission, RolePermission, ProfileRole
- Added customRoles relation to Profile model
- Pushed schema to SQLite database
- Created API routes:
  - `/api/admin/settings` (GET+PUT): auto-seeds 25 settings across 5 categories, audit logs on change
  - `/api/admin/audit-logs` (GET): filtered/paginated audit log retrieval with full-text search
  - `/api/admin/backups` (GET+POST): list backups, create manual backup (copies SQLite file), schedule backups
  - `/api/admin/backups/[id]` (DELETE+POST): delete backup file, restore from backup
  - `/api/admin/roles` (GET+POST): list roles with permissions, create new role
  - `/api/admin/roles/[id]` (GET+PUT+DELETE): single role CRUD, sync permissions
  - `/api/admin/permissions` (GET): 34 permissions across 9 categories, auto-seeds and assigns to default roles
  - `/api/admin/profiles/[id]/roles` (GET+PUT): assign custom roles to profiles
- Fixed roles-tab.tsx: rewrote entirely to match API response format (permissions with IDs, not just codes)
- Fixed settings-tab.tsx: added mounted guard for useTheme hydration, fixed fetchRoles to extract array from {roles:[...]} response
- Fixed audit-logs-tab.tsx: fixed details rendering (API returns parsed objects, not strings), added detailsPreview helper
- Added audit log creation to settings PUT endpoint
- All API routes create AuditLog entries for mutating operations
- Browser verified: all 11 admin sidebar items, Settings 7 sub-tabs (Général, Email, Utilisateurs, Sécurité, Notifications, Apparence, Comptes), Audit Logs with data, Backups, Roles & Permissions with 3 default roles (ADMIN 34 perms, INSURER 8 perms, USER 3 perms)

Stage Summary:
- Complete admin settings system with 7 sub-tabs covering: Général (site name, email, maintenance), Email (SMTP config), Utilisateurs (profile management), Sécurité (password policy, lockout), Notifications (channels & events), Apparence (theme, language, date), Gestion des comptes (roles & status)
- Audit logging system with filtered/searchable log viewer
- Backup management with manual/scheduled backup support
- Role-based permission system with 34 permissions across 9 categories and 3 default roles
- 3 new admin sidebar items: Journaux d'audit, Sauvegardes, Rôles & Permissions
- Lint clean (only pre-existing launch-server.js errors)
- All verified via browser testing
---
Task ID: 6
Agent: fullstack-dev
Task: Fix backups tab - remove mocks, connect to real API

Work Log:
- Read backups-tab.tsx and API route to understand current code and data flow
- Identified Backup interface mismatch with Prisma model (file→filename, size→fileSize, date→createdAt)
- Replaced hardcoded "Espace disque disponible: 2.1 Go" card with "Nombre de sauvegardes" showing real count from API data
- Updated Backup interface to match actual API response fields (createdAt, filename, fileSize)
- Updated all references throughout the component (stats, table cells, mobile cards, alert dialogs)
- Added null-safe fileSize access (b.fileSize ?? 0) in totalSize calculation
- Added Tooltip wrapping to disabled Download buttons (both desktop and mobile) with "Fonctionnalité en développement" message
- Verified toast feedback already exists for restore and delete (uses shadcn useToast, not sonner - correct for this project)
- Verified schedule save correctly calls POST /api/admin/backups?action=schedule with proper JSON body
- Fixed API route to JSON.stringify(schedule) when saving to DB (value column is String type, was receiving object)
- Removed unused AlertTriangle and HardDrive imports, added Layers and Tooltip imports

Stage Summary:
- Backups tab now connects to real API data with correct field mapping
- Stats show: last backup date (from API), total size (calculated from fileSize), backup count (from API)
- Disabled download buttons have tooltip feedback
- Schedule config saves correctly as JSON to SystemSetting table
- No new lint errors introduced

---
Task ID: 1
Agent: main
Task: Fix hydration mismatch error in header.tsx theme toggle

Work Log:
- Verified the existing fix using `useSyncExternalStore` with server snapshot `false` and client snapshot `true`
- The desktop theme button is wrapped in `{mounted && (...)}` preventing server render
- The mobile theme toggle also uses `mounted` guard
- Confirmed no hydration errors in browser console

Stage Summary:
- Hydration fix was already in place and working correctly
- No code changes needed

---
Task ID: 2
Agent: main
Task: Create API endpoint for coverage categories (Step 3 dynamic categories)

Work Log:
- Created `/api/coverage-categories/route.ts` — public GET endpoint
- Returns active coverage categories from DB with id, code, name, description, displayOrder

Stage Summary:
- New file: `src/app/api/coverage-categories/route.ts`
- Categories fetched: 12 (RC, DR, IC, IPT, Incendie, Vol, BDG, TCM, TCL, Assistance, Avance Recours, Accessoires)

---
Task ID: 3
Agent: main
Task: Update comparison-form.tsx Step 3 to use dynamic DB categories

Work Log:
- Removed hardcoded `GUARANTEE_CATEGORIES` constant (8 items)
- Added `useEffect` to fetch categories from `/api/coverage-categories` on mount
- Added `CATEGORY_ICON_MAP` mapping DB codes to Lucide icons
- Step 3 now shows all 12 DB categories dynamically with loading state
- Selection uses DB codes (e.g., "RESPONSABILITE_CIVILE") instead of old frontend IDs

Stage Summary:
- Updated: `src/components/comparison/comparison-form.tsx`
- Categories now dynamic from database (12 categories vs 8 hardcoded)

---
Task ID: 4
Agent: main
Task: Rewrite compare API to filter offers by features (not insurer-level coverages)

Work Log:
- Removed contractType pre-filtering based on selected categories
- Now fetches ALL active offers and filters by offer features array
- Each offer's features are checked against selected category keywords
- Only offers matching at least 1 selected category are returned
- `matchedGuarantees` array populated per offer with matched DB codes
- Updated `CATEGORY_FEATURE_KEYWORDS` to use DB codes as keys

Stage Summary:
- Updated: `src/app/api/compare/route.ts`
- Filtering now works correctly: offers only shown if features match selected guarantees
- Each result includes `matchedGuarantees` array

---
Task ID: 5
Agent: main
Task: Update results page to display matched guarantees on offer cards

Work Log:
- Added `GUARANTEE_LABELS` mapping from DB codes to French display names
- Added "Garanties correspondantes" section with colored badges on each offer card
- Badges show which selected guarantees each offer covers

Stage Summary:
- Updated: `src/components/results/results-page.tsx`
- Each offer card now shows matched guarantee badges with green check icons

---
Task ID: 7
Agent: main
Task: Fix register page broken checkbox text wrapping on mobile

Work Log:
- Diagnosed issue: checkbox text "J'accepte les conditions d'utilisation et la politique de confidentialité" wraps mid-phrase on 375px screens
- VLM confirmed text appeared as garbled: "J'accepte conditions et politique de les d'utilisation la confidentialité"
- Fix: wrapped each phrase segment in `<span className="whitespace-nowrap">` to prevent mid-phrase line breaks
- Applied fix to both `auth-pages.tsx` and `auth-modals.tsx`

Stage Summary:
- Fixed: `src/components/auth/auth-pages.tsx` — checkbox text wrapping
- Fixed: `src/components/auth/auth-modals.tsx` — same fix
- Verified via mobile screenshot that text now reads correctly

---
Task ID: 8
Agent: main
Task: Verify forgot password page text

Work Log:
- VLM reported "Mot de passé oublié" but this was a VLM misread
- Code contains correct "Mot de passe oublié" (\u00e9 = é)
- Browser accessibility tree confirms correct text
- No fix needed
---
Task ID: 1
Agent: Main Agent
Task: Header on auth pages + Profile management + Insurer logo upload

Work Log:
- Added `photoUrl String?` to Profile model in Prisma schema, ran db push
- Added `"profile"` to `AppView` type union
- Added `avatarUrl?: string` to user state in Zustand store
- Updated `isFullPage()` to only return true for "admin" (auth pages now show main Header/Footer)
- Simplified `AuthPages` component to remove its own header/footer (just renders the centered form)
- Created `/api/upload/route.ts` — POST endpoint for file upload (JPG/PNG/WebP/GIF, max 2MB, configurable folder)
- Created `/api/profile/route.ts` — GET (fetch profile) and PUT (update name/phone/photo/password) endpoints
- Created `src/components/profile/profile-page.tsx` — Full profile management page with:
  - Avatar photo upload with hover overlay
  - Personal info form (first name, last name, phone, read-only email)
  - Password change form with current/new/confirm fields
  - Match/mismatch indicators on confirm password
- Updated header.tsx:
  - Avatar image display when `user.avatarUrl` is set (both desktop dropdown trigger and mobile indicator)
  - "Mon profil" dropdown item → `setView("profile")` instead of `setView("dashboard")`
  - Added "Mon profil" button to mobile menu
- Updated auth-pages.tsx:
  - Login and Register now store `avatarUrl: data.user.photoUrl` on success
- Updated auth API (`/api/auth/route.ts`):
  - Both register and login responses now include `photoUrl` field
- Updated assureurs-tab.tsx:
  - Added `logoUrl` to Insurer interface and FormData type
  - Added `handleLogoUpload` function with upload to /api/upload
  - Added logo upload UI in create/edit dialog (preview, change, remove)
  - Added logo thumbnails in desktop table rows and mobile cards
  - Added logo in detail dialog header
- Updated `page.tsx` to handle `profile` view with ProfilePage component

Stage Summary:
- Auth pages now show the main Header (with theme toggle and nav) and Footer
- Users can manage their profile: photo upload, edit name/phone, change password
- Header avatar shows user photo when uploaded
- Admin can upload/assign logos to insurers in the create/edit dialog
- Insurer logos display in table, mobile cards, and detail views

# Custom Roles System Migration Guide

## Overview

This migration implements a flexible Role-Based Access Control (RBAC) system with custom roles and granular permissions while maintaining backward compatibility with the existing USER, INSURER, and ADMIN system roles.

## What Changes

### New Tables

1. **`permissions`** - Stores all available permissions in the system
   - 21 default permissions created automatically
   - Organized by category (USER_MANAGEMENT, OFFER_MANAGEMENT, etc.)
   - Format: `resource.action` (e.g., `user.view`, `offer.create`)

2. **`custom_roles`** - Stores custom roles with their metadata
   - System roles (USER, INSURER, ADMIN) created automatically
   - Custom roles can be created by admins
   - Inactive roles cannot be assigned

3. **`role_permissions`** - Associates permissions with roles
   - Many-to-many relationship
   - Cascade delete when role is deleted

### Modified Tables

**`profiles`** - New column added:
- `custom_role_id` (nullable, foreign key to custom_roles)
- When null, the system uses the legacy `role` column (USER/INSURER/ADMIN)

## How to Apply the Migration

### Option 1: Supabase Dashboard (Recommended for Cloud)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `supabase/migrations/20260419170000_create_custom_roles_system.sql`
5. Paste and run the query

### Option 2: Supabase CLI (Local Development)

```bash
supabase db reset
```

Or apply just this migration:
```bash
supabase db push
```

### Option 3: psql (Direct Database Access)

```bash
psql -h YOUR_HOST -U postgres -d YOUR_DATABASE \
  -f supabase/migrations/20260419170000_create_custom_roles_system.sql
```

## Default Permissions

### User Management
- `user.view` - View users
- `user.create` - Create users
- `user.update` - Update users
- `user.delete` - Delete users

### Offer Management
- `offer.view` - View offers
- `offer.create` - Create offers
- `offer.update` - Update offers
- `offer.delete` - Delete offers

### Quote Management
- `quote.view` - View quotes
- `quote.create` - Create quotes
- `quote.respond` - Respond to quotes

### Policy Management
- `policy.view` - View policies
- `policy.create` - Create policies
- `policy.update` - Update policies

### Analytics & System
- `analytics.view` - View analytics
- `audit.view` - View audit logs
- `system.view` - View system configuration
- `system.update` - Update system configuration

### Role Management
- `role.view` - View roles
- `role.create` - Create roles
- `role.update` - Update roles
- `role.delete` - Delete roles
- `role.assign` - Assign roles to users

## Default System Roles

### USER Role
Permissions: `offer.view`, `quote.view`, `quote.create`, `policy.view`, `user.view`

### INSURER Role
Permissions: All USER permissions plus:
- `offer.*` (full offer management)
- `quote.respond`
- `policy.*` (create, update)
- `analytics.view`

### ADMIN Role
Permissions: All 21 permissions (full access)

## Backward Compatibility

The migration is **100% backward compatible**:

1. **Existing roles preserved**: USER, INSURER, ADMIN continue to work
2. **Legacy column kept**: The `role` column in `profiles` table is not removed
3. **Automatic fallback**: If `custom_role_id` is null, the system uses the `role` column
4. **No breaking changes**: All existing code continues to work

## Permission Resolution Order

For any user, permissions are resolved as follows:

1. If `custom_role_id` is NOT null:
   - Use permissions from the custom role
2. If `custom_role_id` is null:
   - Use permissions from the system role (USER/INSURER/ADMIN)

## PostgreSQL Functions

The migration creates/updates these functions:

- `get_user_permissions(p_user_uuid)` - Get all permissions for a user
- `user_has_permission_with_action(p_permission_name, p_action, p_target_user)` - Check specific permission
- `is_admin_custom(p_user_id)` - Check if user is admin (custom or system)
- `can_delete_role(p_role_id)` - Check if role can be deleted
- `get_role_with_permissions(p_role_id)` - Get role with all permissions

## RLS Policies

Row Level Security policies are configured to:

- Allow all authenticated users to view active roles and permissions
- Restrict creation/modification/deletion to admins only
- Prevent deletion of system roles
- Prevent deletion of roles assigned to users

## Testing After Migration

### Verify Tables Exist

```sql
SELECT COUNT(*) FROM permissions;
-- Should return 21

SELECT COUNT(*) FROM custom_roles;
-- Should return 3 (USER, INSURER, ADMIN)

SELECT COUNT(*) FROM role_permissions;
-- Should return at least 21 (permissions assigned to system roles)
```

### Verify System Roles

```sql
SELECT name, is_system_role, is_active
FROM custom_roles
ORDER BY is_system_role DESC, name;
```

### Verify a User's Permissions

```sql
SELECT * FROM get_user_permissions('user-uuid-here');
```

## Rollback

If needed, you can rollback this migration:

```sql
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.custom_roles CASCADE;
DROP TABLE IF EXISTS public.permissions CASCADE;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS custom_role_id;
```

## Support

For issues or questions:
1. Check the migration logs in Supabase Dashboard
2. Review the RLS policies in Database > Authentication > Policies
3. Test with the verification queries above

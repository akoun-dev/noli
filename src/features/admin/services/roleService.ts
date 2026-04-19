import { Role, Permission, UserPermission, PermissionCategory } from '@/types/admin';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { Permission as DBPermission, CustomRole, RolePermission } from '@/types/database';

/**
 * Custom Roles Service
 *
 * Implements a flexible RBAC system with custom roles and permissions.
 * Maintains backward compatibility with the legacy USER/INSURER/ADMIN system roles.
 *
 * - Custom roles are stored in custom_roles table
 * - Permissions are stored in permissions table
 * - Role-permission associations are in role_permissions table
 * - Users can have either a custom_role_id or use the legacy role column
 */

// Map database permission to admin Permission type
const mapDBPermissionToAdmin = (dbPerm: DBPermission): Permission => ({
  id: dbPerm.id,
  name: `${dbPerm.resource}.${dbPerm.action}`,
  resource: dbPerm.resource.toUpperCase() as any,
  action: dbPerm.action.toUpperCase() as any,
  description: dbPerm.description || '',
  category: dbPerm.category as PermissionCategory,
});

// Map database role to admin Role type
const mapDBRoleToAdmin = async (dbRole: CustomRole & { permissions?: DBPermission[] }): Promise<Role> => {
  // If permissions not included, fetch them
  let permissions: DBPermission[] = dbRole.permissions || [];

  if (!dbRole.permissions || dbRole.permissions.length === 0) {
    const { data: rolePerms } = await supabase
      .from('role_permissions')
      .select('permission_id, permissions!inner(*)')
      .eq('role_id', dbRole.id);

    if (rolePerms) {
      permissions = rolePerms.map(rp => (rp as any).permissions);
    }
  }

  return {
    id: dbRole.id,
    name: dbRole.name,
    description: dbRole.description || '',
    permissions: permissions.map(mapDBPermissionToAdmin),
    isActive: dbRole.is_active,
    createdAt: new Date(dbRole.created_at),
    updatedAt: new Date(dbRole.updated_at),
    createdBy: dbRole.created_by || 'system',
    isSystemRole: dbRole.is_system_role,
  };
};

export const roleService = {
  /**
   * Get all roles (system + custom)
   */
  async getRoles(): Promise<Role[]> {
    try {
      const { data: roles, error } = await supabase
        .from('custom_roles')
        .select(`
          *,
          permissions:role_permissions(
            permissions!inner(*)
          )
        `)
        .order('is_system_role', { ascending: false })
        .order('name');

      if (error) {
        logger.error('[roleService] Error fetching roles:', error);
        throw error;
      }

      // Map and flatten permissions
      const mappedRoles = await Promise.all(
        (roles || []).map(async (role: any) => {
          const permissions = role.permissions
            ?.map((rp: any) => rp.permissions)
            .filter(Boolean) || [];

          return {
            id: role.id,
            name: role.name,
            description: role.description || '',
            permissions: permissions.map(mapDBPermissionToAdmin),
            isActive: role.is_active,
            createdAt: new Date(role.created_at),
            updatedAt: new Date(role.updated_at),
            createdBy: role.created_by || 'system',
            isSystemRole: role.is_system_role,
          };
        })
      );

      logger.info('[roleService] Fetched roles:', mappedRoles.length);
      return mappedRoles;
    } catch (error) {
      logger.error('[roleService] Error in getRoles:', error);
      throw error;
    }
  },

  /**
   * Get a single role by ID with permissions
   */
  async getRole(id: string): Promise<Role | null> {
    try {
      const { data: role, error } = await supabase
        .from('custom_roles')
        .select(`
          *,
          permissions:role_permissions(
            permissions!inner(*)
          )
        `)
        .eq('id', id)
        .single();

      if (error || !role) {
        logger.warn(`[roleService] Role not found: ${id}`);
        return null;
      }

      const permissions = (role as any).permissions
        ?.map((rp: any) => rp.permissions)
        .filter(Boolean) || [];

      return {
        id: role.id,
        name: role.name,
        description: role.description || '',
        permissions: permissions.map(mapDBPermissionToAdmin),
        isActive: role.is_active,
        createdAt: new Date(role.created_at),
        updatedAt: new Date(role.updated_at),
        createdBy: role.created_by || 'system',
        isSystemRole: role.is_system_role,
      };
    } catch (error) {
      logger.error(`[roleService] Error in getRole(${id}):`, error);
      throw error;
    }
  },

  /**
   * Create a new custom role
   */
  async createRole(role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<Role> {
    try {
      // Validate: cannot create system roles
      if (role.isSystemRole) {
        throw new Error('Cannot create system roles through this interface');
      }

      // Get current user for created_by
      const { data: { user } } = await supabase.auth.getUser();
      const createdBy = user?.id || null;

      // Check for duplicate name
      const { data: existing } = await supabase
        .from('custom_roles')
        .select('id')
        .eq('name', role.name)
        .single();

      if (existing) {
        throw new Error(`Role with name "${role.name}" already exists`);
      }

      // Create the role
      const { data: newRole, error: roleError } = await supabase
        .from('custom_roles')
        .insert({
          name: role.name,
          description: role.description,
          is_system_role: false,
          is_active: role.isActive,
          created_by: createdBy,
        })
        .select()
        .single();

      if (roleError || !newRole) {
        logger.error('[roleService] Error creating role:', roleError);
        throw roleError || new Error('Failed to create role');
      }

      // Associate permissions
      if (role.permissions.length > 0) {
        const permissionAssociations = role.permissions.map(perm => ({
          role_id: newRole.id,
          permission_id: perm.id,
        }));

        const { error: permError } = await supabase
          .from('role_permissions')
          .insert(permissionAssociations);

        if (permError) {
          logger.error('[roleService] Error associating permissions:', permError);
          // Clean up the role if permission association failed
          await supabase.from('custom_roles').delete().eq('id', newRole.id);
          throw permError;
        }
      }

      // Log the action
      await supabase.rpc('log_user_action_safe', {
        user_action: 'create_role',
        resource_name: 'custom_role',
        resource_id_value: newRole.id,
        metadata_value: {
          role_name: role.name,
          permissions_count: role.permissions.length,
        } as any,
      });

      logger.info(`[roleService] Created role: ${newRole.id}`);

      // Return the complete role
      return this.getRole(newRole.id) as Promise<Role>;
    } catch (error) {
      logger.error('[roleService] Error in createRole:', error);
      throw error;
    }
  },

  /**
   * Update an existing custom role
   */
  async updateRole(id: string, updates: Partial<Role>): Promise<Role> {
    try {
      // First, check if the role exists and is not a system role
      const { data: existingRole, error: fetchError } = await supabase
        .from('custom_roles')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !existingRole) {
        throw new Error('Role not found');
      }

      if (existingRole.is_system_role) {
        throw new Error('Cannot modify system roles');
      }

      // Prepare updates
      const roleUpdates: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.name !== undefined) {
        // Check for duplicate name (excluding current role)
        const { data: duplicate } = await supabase
          .from('custom_roles')
          .select('id')
          .eq('name', updates.name)
          .neq('id', id)
          .single();

        if (duplicate) {
          throw new Error(`Role with name "${updates.name}" already exists`);
        }
        roleUpdates.name = updates.name;
      }

      if (updates.description !== undefined) {
        roleUpdates.description = updates.description;
      }

      if (updates.isActive !== undefined) {
        roleUpdates.is_active = updates.isActive;
      }

      // Update the role
      const { error: updateError } = await supabase
        .from('custom_roles')
        .update(roleUpdates)
        .eq('id', id);

      if (updateError) {
        logger.error('[roleService] Error updating role:', updateError);
        throw updateError;
      }

      // Update permissions if provided
      if (updates.permissions) {
        // Delete existing permissions
        const { error: deleteError } = await supabase
          .from('role_permissions')
          .delete()
          .eq('role_id', id);

        if (deleteError) {
          logger.error('[roleService] Error deleting old permissions:', deleteError);
          throw deleteError;
        }

        // Add new permissions
        if (updates.permissions.length > 0) {
          const permissionAssociations = updates.permissions.map(perm => ({
            role_id: id,
            permission_id: perm.id,
          }));

          const { error: insertError } = await supabase
            .from('role_permissions')
            .insert(permissionAssociations);

          if (insertError) {
            logger.error('[roleService] Error inserting new permissions:', insertError);
            throw insertError;
          }
        }
      }

      // Log the action
      await supabase.rpc('log_user_action_safe', {
        user_action: 'update_role',
        resource_name: 'custom_role',
        resource_id_value: id,
        metadata_value: {
          updates: Object.keys(updates),
          permissions_count: updates.permissions?.length,
        } as any,
      });

      logger.info(`[roleService] Updated role: ${id}`);

      // Return the updated role
      return this.getRole(id) as Promise<Role>;
    } catch (error) {
      logger.error(`[roleService] Error in updateRole(${id}):`, error);
      throw error;
    }
  },

  /**
   * Delete a custom role
   */
  async deleteRole(id: string): Promise<void> {
    try {
      // Check if role can be deleted
      const { data: canDelete, error: checkError } = await supabase
        .rpc('can_delete_role', { p_role_id: id });

      if (checkError) {
        logger.error('[roleService] Error checking if role can be deleted:', checkError);
        throw checkError;
      }

      if (!canDelete) {
        throw new Error('Cannot delete this role: either it is a system role or it is assigned to users');
      }

      // Delete the role (cascade will delete role_permissions)
      const { error: deleteError } = await supabase
        .from('custom_roles')
        .delete()
        .eq('id', id);

      if (deleteError) {
        logger.error('[roleService] Error deleting role:', deleteError);
        throw deleteError;
      }

      // Log the action
      await supabase.rpc('log_user_action_safe', {
        user_action: 'delete_role',
        resource_name: 'custom_role',
        resource_id_value: id,
      });

      logger.info(`[roleService] Deleted role: ${id}`);
    } catch (error) {
      logger.error(`[roleService] Error in deleteRole(${id}):`, error);
      throw error;
    }
  },

  /**
   * Get all permissions
   */
  async getPermissions(category?: PermissionCategory): Promise<Permission[]> {
    try {
      let query = supabase
        .from('permissions')
        .select('*')
        .order('category', { ascending: true })
        .order('resource', { ascending: true })
        .order('action', { ascending: true });

      if (category) {
        query = query.eq('category', category);
      }

      const { data: permissions, error } = await query;

      if (error) {
        logger.error('[roleService] Error fetching permissions:', error);
        throw error;
      }

      return (permissions || []).map(mapDBPermissionToAdmin);
    } catch (error) {
      logger.error('[roleService] Error in getPermissions:', error);
      throw error;
    }
  },

  /**
   * Get permission categories with descriptions
   */
  async getPermissionCategories(): Promise<{
    category: PermissionCategory;
    label: string;
    description: string;
  }[]> {
    return [
      {
        category: 'USER_MANAGEMENT',
        label: 'Gestion des utilisateurs',
        description: 'Permissions pour la gestion des comptes utilisateurs',
      },
      {
        category: 'OFFER_MANAGEMENT',
        label: 'Gestion des offres',
        description: 'Permissions pour la gestion des offres d\'assurance',
      },
      {
        category: 'QUOTE_MANAGEMENT',
        label: 'Gestion des devis',
        description: 'Permissions pour la gestion des devis',
      },
      {
        category: 'POLICY_MANAGEMENT',
        label: 'Gestion des polices',
        description: 'Permissions pour la gestion des polices d\'assurance',
      },
      {
        category: 'PAYMENT_MANAGEMENT',
        label: 'Gestion des paiements',
        description: 'Permissions pour la gestion des paiements',
      },
      {
        category: 'ANALYTICS',
        label: 'Analytique',
        description: 'Permissions pour l\'accès aux rapports et statistiques',
      },
      {
        category: 'AUDIT_LOGS',
        label: 'Journaux d\'audit',
        description: 'Permissions pour l\'accès aux journaux d\'audit',
      },
      {
        category: 'SYSTEM_CONFIG',
        label: 'Configuration système',
        description: 'Permissions pour la configuration du système',
      },
      {
        category: 'ROLE_MANAGEMENT',
        label: 'Gestion des rôles',
        description: 'Permissions pour la gestion des rôles et permissions',
      },
    ];
  },

  /**
   * Get user permissions and role info
   */
  async getUserPermissions(userId: string): Promise<UserPermission | null> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          id,
          role,
          custom_role_id,
          custom_roles!inner(
            id,
            name,
            is_system_role,
            is_active
          )
        `)
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        logger.error('[roleService] Error fetching user profile:', error);
        throw error;
      }

      if (!profile) {
        logger.warn(`[roleService] User profile not found: ${userId}`);
        return null;
      }

      const roleId = profile.custom_role_id || profile.role;

      return {
        userId,
        roleId,
        additionalPermissions: [],
        revokedPermissions: [],
      };
    } catch (error) {
      logger.error(`[roleService] Error in getUserPermissions(${userId}):`, error);
      throw error;
    }
  },

  /**
   * Assign a custom role to a user
   */
  async assignCustomRole(userId: string, roleId: string): Promise<void> {
    try {
      // Check if role exists and is active
      const { data: role, error: roleError } = await supabase
        .from('custom_roles')
        .select('id, is_active')
        .eq('id', roleId)
        .single();

      if (roleError || !role) {
        throw new Error('Role not found');
      }

      if (!role.is_active) {
        throw new Error('Cannot assign inactive role');
      }

      // Update user's custom_role_id
      const { error } = await supabase
        .from('profiles')
        .update({ custom_role_id: roleId })
        .eq('id', userId);

      if (error) {
        logger.error(`[roleService] Error assigning role to user ${userId}:`, error);
        throw error;
      }

      // Log the action
      await supabase.rpc('log_user_action_safe', {
        user_action: 'assign_role',
        resource_name: 'profile',
        resource_id_value: userId,
        metadata_value: {
          custom_role_id: roleId,
        } as any,
      });

      logger.info(`[roleService] Assigned role ${roleId} to user ${userId}`);
    } catch (error) {
      logger.error(`[roleService] Error in assignCustomRole(${userId}, ${roleId}):`, error);
      throw error;
    }
  },

  /**
   * Revoke a custom role from a user
   */
  async revokeCustomRole(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ custom_role_id: null })
        .eq('id', userId);

      if (error) {
        logger.error(`[roleService] Error revoking role from user ${userId}:`, error);
        throw error;
      }

      // Log the action
      await supabase.rpc('log_user_action_safe', {
        user_action: 'revoke_role',
        resource_name: 'profile',
        resource_id_value: userId,
      });

      logger.info(`[roleService] Revoked custom role from user ${userId}`);
    } catch (error) {
      logger.error(`[roleService] Error in revokeCustomRole(${userId}):`, error);
      throw error;
    }
  },

  /**
   * Assign a system role (legacy)
   */
  async assignRole(userId: string, roleId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: roleId as any, custom_role_id: null })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      logger.info(`[roleService] Assigned system role ${roleId} to user ${userId}`);
    } catch (error) {
      logger.error(`[roleService] Error in assignRole(${userId}, ${roleId}):`, error);
      throw error;
    }
  },

  /**
   * Update user permissions
   */
  async updateUserPermissions(userId: string, permissions: Partial<UserPermission>): Promise<UserPermission> {
    try {
      if (permissions.roleId) {
        // Check if it's a custom role or system role
        const { data: customRole } = await supabase
          .from('custom_roles')
          .select('id')
          .eq('id', permissions.roleId)
          .single();

        if (customRole) {
          await this.assignCustomRole(userId, permissions.roleId);
        } else {
          await this.assignRole(userId, permissions.roleId);
        }
      }

      const userPermission = await this.getUserPermissions(userId);
      if (!userPermission) {
        throw new Error('User not found');
      }

      return {
        ...userPermission,
        ...permissions,
      };
    } catch (error) {
      logger.error(`[roleService] Error in updateUserPermissions(${userId}):`, error);
      throw error;
    }
  },

  /**
   * Get user's effective permissions
   */
  async getUserEffectivePermissions(userId: string): Promise<Permission[]> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('custom_role_id, role')
        .eq('id', userId)
        .single();

      if (!profile) {
        return [];
      }

      let permissions: DBPermission[] = [];

      // If user has custom role, get those permissions
      if (profile.custom_role_id) {
        const { data: rolePerms } = await supabase
          .from('role_permissions')
          .select('permissions!inner(*)')
          .eq('role_id', profile.custom_role_id);

        permissions = rolePerms?.map(rp => (rp as any).permissions) || [];
      } else {
        // Use system role permissions
        const { data: systemRole } = await supabase
          .from('custom_roles')
          .select('id')
          .eq('name', profile.role)
          .single();

        if (systemRole) {
          const { data: rolePerms } = await supabase
            .from('role_permissions')
            .select('permissions!inner(*)')
            .eq('role_id', systemRole.id);

          permissions = rolePerms?.map(rp => (rp as any).permissions) || [];
        }
      }

      return permissions.map(mapDBPermissionToAdmin);
    } catch (error) {
      logger.error(`[roleService] Error in getUserEffectivePermissions(${userId}):`, error);
      throw error;
    }
  },

  /**
   * Check if user has specific permission
   */
  async checkPermission(userId: string, resource: string, action: string): Promise<boolean> {
    try {
      const effectivePermissions = await this.getUserEffectivePermissions(userId);
      return effectivePermissions.some(
        (p) => p.resource.toLowerCase() === resource.toLowerCase() &&
               p.action.toLowerCase() === action.toLowerCase()
      );
    } catch (error) {
      logger.error(`[roleService] Error in checkPermission(${userId}, ${resource}, ${action}):`, error);
      return false;
    }
  },

  /**
   * Get role statistics
   */
  async getRoleStatistics(): Promise<{
    totalRoles: number;
    activeRoles: number;
    totalPermissions: number;
    usersByRole: { roleId: string; roleName: string; userCount: number }[];
  }> {
    try {
      // Get all roles
      const { data: roles, error: rolesError } = await supabase
        .from('custom_roles')
        .select('id, name, is_active')
        .order('is_system_role', { ascending: false })
        .order('name');

      if (rolesError) {
        logger.error('[roleService] Error fetching roles for statistics:', rolesError);
        throw rolesError;
      }

      // Count users by role (including system role fallback)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('custom_role_id, role')
        .not('custom_role_id', 'is', null);

      if (profilesError) {
        logger.error('[roleService] Error fetching profiles for statistics:', profilesError);
        throw profilesError;
      }

      // Count users per custom role
      const customRoleCounts = (profiles || []).reduce((acc, profile) => {
        if (profile.custom_role_id) {
          acc[profile.custom_role_id] = (acc[profile.custom_role_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      // Get total permissions count
      const { count: totalPermissions, error: countError } = await supabase
        .from('permissions')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        logger.error('[roleService] Error counting permissions:', countError);
        throw countError;
      }

      const usersByRole = (roles || []).map((role) => ({
        roleId: role.id,
        roleName: role.name,
        userCount: customRoleCounts[role.id] || 0,
      }));

      return {
        totalRoles: roles?.length || 0,
        activeRoles: roles?.filter(r => r.is_active).length || 0,
        totalPermissions: totalPermissions || 0,
        usersByRole,
      };
    } catch (error) {
      logger.error('[roleService] Error in getRoleStatistics:', error);
      throw error;
    }
  },
};

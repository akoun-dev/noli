import { Role, Permission, UserPermission, PermissionCategory } from '@/types/admin';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

// NOTE: Role system is based on profiles.role field (USER, INSURER, ADMIN)
// This service provides compatibility with the admin UI but uses the existing database structure
// For advanced RBAC, create roles and permissions tables in Supabase

// Default permissions based on user roles in the system
const getDefaultPermissions = (roleName: string): Permission[] => {
  // All roles can view basic data
  const basePermissions: Permission[] = [
    {
      id: `${roleName.toLowerCase()}-view-profile`,
      name: 'Voir son profil',
      resource: 'USER',
      action: 'READ',
      description: 'Consulter son propre profil',
      category: 'USER_MANAGEMENT',
    },
  ];

  switch (roleName) {
    case 'ADMIN':
      return [
        ...basePermissions,
        { id: 'admin-user-view', name: 'Voir les utilisateurs', resource: 'USER', action: 'READ', description: 'Consulter la liste des utilisateurs', category: 'USER_MANAGEMENT' },
        { id: 'admin-user-create', name: 'Créer des utilisateurs', resource: 'USER', action: 'CREATE', description: 'Créer de nouveaux utilisateurs', category: 'USER_MANAGEMENT' },
        { id: 'admin-user-update', name: 'Modifier les utilisateurs', resource: 'USER', action: 'UPDATE', description: 'Modifier les informations des utilisateurs', category: 'USER_MANAGEMENT' },
        { id: 'admin-user-delete', name: 'Supprimer des utilisateurs', resource: 'USER', action: 'DELETE', description: 'Supprimer des utilisateurs', category: 'USER_MANAGEMENT' },
        { id: 'admin-offer-view', name: 'Voir les offres', resource: 'OFFER', action: 'READ', description: 'Consulter les offres d\'assurance', category: 'OFFER_MANAGEMENT' },
        { id: 'admin-offer-create', name: 'Créer des offres', resource: 'OFFER', action: 'CREATE', description: 'Créer de nouvelles offres d\'assurance', category: 'OFFER_MANAGEMENT' },
        { id: 'admin-offer-update', name: 'Modifier des offres', resource: 'OFFER', action: 'UPDATE', description: 'Modifier les offres existantes', category: 'OFFER_MANAGEMENT' },
        { id: 'admin-offer-delete', name: 'Supprimer des offres', resource: 'OFFER', action: 'DELETE', description: 'Supprimer des offres', category: 'OFFER_MANAGEMENT' },
        { id: 'admin-analytics-view', name: 'Voir les analytics', resource: 'ANALYTICS', action: 'READ', description: 'Consulter les rapports et statistiques', category: 'ANALYTICS' },
        { id: 'admin-audit-view', name: 'Voir les journaux d\'audit', resource: 'AUDIT', action: 'READ', description: 'Consulter les journaux d\'audit', category: 'AUDIT_LOGS' },
        { id: 'admin-system-config-view', name: 'Voir la configuration système', resource: 'SYSTEM', action: 'READ', description: 'Consulter la configuration système', category: 'SYSTEM_CONFIG' },
      ];
    case 'INSURER':
      return [
        ...basePermissions,
        { id: 'insurer-offer-view', name: 'Voir les offres', resource: 'OFFER', action: 'READ', description: 'Consulter les offres d\'assurance', category: 'OFFER_MANAGEMENT' },
        { id: 'insurer-offer-create', name: 'Créer des offres', resource: 'OFFER', action: 'CREATE', description: 'Créer de nouvelles offres d\'assurance', category: 'OFFER_MANAGEMENT' },
        { id: 'insurer-offer-update', name: 'Modifier des offres', resource: 'OFFER', action: 'UPDATE', description: 'Modifier les offres existantes', category: 'OFFER_MANAGEMENT' },
        { id: 'insurer-quote-view', name: 'Voir les devis', resource: 'QUOTE', action: 'READ', description: 'Consulter les devis', category: 'QUOTE_MANAGEMENT' },
        { id: 'insurer-quote-respond', name: 'Répondre aux devis', resource: 'QUOTE', action: 'RESPOND', description: 'Accepter ou rejeter les devis', category: 'QUOTE_MANAGEMENT' },
        { id: 'insurer-policy-view', name: 'Voir les polices', resource: 'POLICY', action: 'READ', description: 'Consulter les polices d\'assurance', category: 'POLICY_MANAGEMENT' },
        { id: 'insurer-analytics-view', name: 'Voir les analytics', resource: 'ANALYTICS', action: 'READ', description: 'Consulter les rapports et statistiques', category: 'ANALYTICS' },
      ];
    case 'USER':
      return [
        ...basePermissions,
        { id: 'user-offer-view', name: 'Voir les offres', resource: 'OFFER', action: 'READ', description: 'Consulter les offres d\'assurance', category: 'OFFER_MANAGEMENT' },
        { id: 'user-quote-create', name: 'Créer des devis', resource: 'QUOTE', action: 'CREATE', description: 'Créer des demandes de devis', category: 'QUOTE_MANAGEMENT' },
        { id: 'user-quote-view', name: 'Voir les devis', resource: 'QUOTE', action: 'READ', description: 'Consulter ses devis', category: 'QUOTE_MANAGEMENT' },
        { id: 'user-policy-view', name: 'Voir les polices', resource: 'POLICY', action: 'READ', description: 'Consulter ses polices d\'assurance', category: 'POLICY_MANAGEMENT' },
        { id: 'user-payment-view', name: 'Voir les paiements', resource: 'PAYMENT', action: 'READ', description: 'Consulter l\'historique des paiements', category: 'PAYMENT_MANAGEMENT' },
      ];
    default:
      return basePermissions;
  }
};

// Roles based on the profiles.role enum
const getSystemRoles = (): Role[] => {
  return [
    {
      id: 'ADMIN',
      name: 'Administrateur',
      description: 'Accès complet à toutes les fonctionnalités du système',
      permissions: getDefaultPermissions('ADMIN'),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
    },
    {
      id: 'INSURER',
      name: 'Assureur',
      description: 'Gestion des offres, devis et polices pour une compagnie d\'assurance',
      permissions: getDefaultPermissions('INSURER'),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
    },
    {
      id: 'USER',
      name: 'Utilisateur',
      description: 'Accès client standard pour comparer des offres et gérer ses polices',
      permissions: getDefaultPermissions('USER'),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
    },
  ];
};

export const roleService = {
  async getRoles(): Promise<Role[]> {
    try {
      // Return system roles based on profiles.role enum
      return getSystemRoles();
    } catch (error) {
      logger.error('Error in getRoles:', error);
      throw error;
    }
  },

  async getRole(id: string): Promise<Role | null> {
    try {
      const roles = getSystemRoles();
      return roles.find((role) => role.id === id) || null;
    } catch (error) {
      logger.error(`Error in getRole(${id}):`, error);
      throw error;
    }
  },

  async createRole(role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<Role> {
    // Not implemented - roles are fixed in the system (USER, INSURER, ADMIN)
    throw new Error('Creating custom roles is not supported. Roles are managed by the system.');
  },

  async updateRole(id: string, updates: Partial<Role>): Promise<Role> {
    // Not implemented - roles are fixed in the system
    throw new Error('Updating system roles is not supported.');
  },

  async deleteRole(id: string): Promise<void> {
    // Not implemented - cannot delete system roles
    throw new Error('Deleting system roles is not supported.');
  },

  async getPermissions(category?: PermissionCategory): Promise<Permission[]> {
    try {
      const roles = getSystemRoles();
      const allPermissions = roles.flatMap((role) => role.permissions);

      // Remove duplicates
      const uniquePermissions = allPermissions.filter(
        (permission, index, self) =>
          index === self.findIndex((p) => p.id === permission.id)
      );

      if (category) {
        return uniquePermissions.filter((p) => p.category === category);
      }

      return uniquePermissions;
    } catch (error) {
      logger.error('Error in getPermissions:', error);
      throw error;
    }
  },

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
    ];
  },

  async getUserPermissions(userId: string): Promise<UserPermission | null> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        return null;
      }

      return {
        userId,
        roleId: profile.role,
        additionalPermissions: [],
        revokedPermissions: [],
      };
    } catch (error) {
      logger.error(`Error in getUserPermissions(${userId}):`, error);
      throw error;
    }
  },

  async assignRole(userId: string, roleId: string): Promise<void> {
    try {
      // Update user's role in profiles table
      const { error } = await supabase
        .from('profiles')
        .update({ role: roleId as any })
        .eq('id', userId);

      if (error) {
        throw error;
      }
    } catch (error) {
      logger.error(`Error in assignRole(${userId}, ${roleId}):`, error);
      throw error;
    }
  },

  async updateUserPermissions(userId: string, permissions: Partial<UserPermission>): Promise<UserPermission> {
    try {
      // Update user's role if provided
      if (permissions.roleId) {
        await this.assignRole(userId, permissions.roleId);
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
      logger.error(`Error in updateUserPermissions(${userId}):`, error);
      throw error;
    }
  },

  async getUserEffectivePermissions(userId: string): Promise<Permission[]> {
    try {
      const userPermission = await this.getUserPermissions(userId);
      if (!userPermission) {
        return [];
      }

      const role = await this.getRole(userPermission.roleId);
      if (!role) {
        return [];
      }

      return role.permissions;
    } catch (error) {
      logger.error(`Error in getUserEffectivePermissions(${userId}):`, error);
      throw error;
    }
  },

  async checkPermission(userId: string, resource: string, action: string): Promise<boolean> {
    try {
      const effectivePermissions = await this.getUserEffectivePermissions(userId);
      return effectivePermissions.some(
        (p) => p.resource === resource && p.action === action
      );
    } catch (error) {
      logger.error(`Error in checkPermission(${userId}, ${resource}, ${action}):`, error);
      return false;
    }
  },

  async getRoleStatistics(): Promise<{
    totalRoles: number;
    activeRoles: number;
    totalPermissions: number;
    usersByRole: { roleId: string; roleName: string; userCount: number }[];
  }> {
    try {
      // Count users by role from profiles table
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('role');

      if (error) {
        throw error;
      }

      const roleCounts = (profiles || []).reduce((acc, profile) => {
        acc[profile.role] = (acc[profile.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const usersByRole = Object.entries(roleCounts).map(([roleId, userCount]) => {
        const role = getSystemRoles().find((r) => r.id === roleId);
        return {
          roleId,
          roleName: role?.name || roleId,
          userCount,
        };
      });

      const roles = getSystemRoles();
      const totalPermissions = roles.reduce(
        (sum, role) => sum + role.permissions.length,
        0
      );

      return {
        totalRoles: roles.length,
        activeRoles: roles.filter((role) => role.isActive).length,
        totalPermissions,
        usersByRole,
      };
    } catch (error) {
      logger.error('Error in getRoleStatistics:', error);
      throw error;
    }
  },
};

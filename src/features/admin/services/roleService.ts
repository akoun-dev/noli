import { Role, Permission, UserPermission, PermissionCategory } from '@/types/admin';

const mockPermissions: Permission[] = [
  // Gestion des utilisateurs
  { id: 'user-view', name: 'Voir les utilisateurs', resource: 'USER', action: 'READ', description: 'Consulter la liste des utilisateurs', category: 'USER_MANAGEMENT' },
  { id: 'user-create', name: 'Créer des utilisateurs', resource: 'USER', action: 'CREATE', description: 'Créer de nouveaux utilisateurs', category: 'USER_MANAGEMENT' },
  { id: 'user-update', name: 'Modifier les utilisateurs', resource: 'USER', action: 'UPDATE', description: 'Modifier les informations des utilisateurs', category: 'USER_MANAGEMENT' },
  { id: 'user-delete', name: 'Supprimer des utilisateurs', resource: 'USER', action: 'DELETE', description: 'Supprimer des utilisateurs', category: 'USER_MANAGEMENT' },
  { id: 'user-activate', name: 'Activer/Désactiver des utilisateurs', resource: 'USER', action: 'ACTIVATE', description: 'Activer ou désactiver des comptes utilisateurs', category: 'USER_MANAGEMENT' },

  // Gestion des rôles
  { id: 'role-view', name: 'Voir les rôles', resource: 'ROLE', action: 'READ', description: 'Consulter la liste des rôles', category: 'ROLE_MANAGEMENT' },
  { id: 'role-create', name: 'Créer des rôles', resource: 'ROLE', action: 'CREATE', description: 'Créer de nouveaux rôles', category: 'ROLE_MANAGEMENT' },
  { id: 'role-update', name: 'Modifier les rôles', resource: 'ROLE', action: 'UPDATE', description: 'Modifier les rôles existants', category: 'ROLE_MANAGEMENT' },
  { id: 'role-delete', name: 'Supprimer des rôles', resource: 'ROLE', action: 'DELETE', description: 'Supprimer des rôles', category: 'ROLE_MANAGEMENT' },
  { id: 'role-assign', name: 'Attribuer des rôles', resource: 'ROLE', action: 'ASSIGN', description: 'Attribuer des rôles aux utilisateurs', category: 'ROLE_MANAGEMENT' },

  // Gestion des offres
  { id: 'offer-view', name: 'Voir les offres', resource: 'OFFER', action: 'READ', description: 'Consulter les offres d\'assurance', category: 'OFFER_MANAGEMENT' },
  { id: 'offer-create', name: 'Créer des offres', resource: 'OFFER', action: 'CREATE', description: 'Créer de nouvelles offres d\'assurance', category: 'OFFER_MANAGEMENT' },
  { id: 'offer-update', name: 'Modifier des offres', resource: 'OFFER', action: 'UPDATE', description: 'Modifier les offres existantes', category: 'OFFER_MANAGEMENT' },
  { id: 'offer-delete', name: 'Supprimer des offres', resource: 'OFFER', action: 'DELETE', description: 'Supprimer des offres', category: 'OFFER_MANAGEMENT' },
  { id: 'offer-publish', name: 'Publier des offres', resource: 'OFFER', action: 'PUBLISH', description: 'Publier ou dépublier des offres', category: 'OFFER_MANAGEMENT' },

  // Gestion des devis
  { id: 'quote-view', name: 'Voir les devis', resource: 'QUOTE', action: 'READ', description: 'Consulter les devis', category: 'QUOTE_MANAGEMENT' },
  { id: 'quote-update', name: 'Modifier les devis', resource: 'QUOTE', action: 'UPDATE', description: 'Modifier les devis existants', category: 'QUOTE_MANAGEMENT' },
  { id: 'quote-delete', name: 'Supprimer les devis', resource: 'QUOTE', action: 'DELETE', description: 'Supprimer des devis', category: 'QUOTE_MANAGEMENT' },
  { id: 'quote-respond', name: 'Répondre aux devis', resource: 'QUOTE', action: 'RESPOND', description: 'Accepter ou rejeter les devis', category: 'QUOTE_MANAGEMENT' },

  // Gestion des polices
  { id: 'policy-view', name: 'Voir les polices', resource: 'POLICY', action: 'READ', description: 'Consulter les polices d\'assurance', category: 'POLICY_MANAGEMENT' },
  { id: 'policy-create', name: 'Créer des polices', resource: 'POLICY', action: 'CREATE', description: 'Créer de nouvelles polices', category: 'POLICY_MANAGEMENT' },
  { id: 'policy-update', name: 'Modifier des polices', resource: 'POLICY', action: 'UPDATE', description: 'Modifier les polices existantes', category: 'POLICY_MANAGEMENT' },
  { id: 'policy-cancel', name: 'Annuler des polices', resource: 'POLICY', action: 'CANCEL', description: 'Annuler des polices', category: 'POLICY_MANAGEMENT' },

  // Gestion des paiements
  { id: 'payment-view', name: 'Voir les paiements', resource: 'PAYMENT', action: 'READ', description: 'Consulter l\'historique des paiements', category: 'PAYMENT_MANAGEMENT' },
  { id: 'payment-process', name: 'Traiter les paiements', resource: 'PAYMENT', action: 'PROCESS', description: 'Traiter les paiements', category: 'PAYMENT_MANAGEMENT' },
  { id: 'payment-refund', name: 'Rembourser des paiements', resource: 'PAYMENT', action: 'REFUND', description: 'Effectuer des remboursements', category: 'PAYMENT_MANAGEMENT' },

  // Analytique
  { id: 'analytics-view', name: 'Voir les analytics', resource: 'ANALYTICS', action: 'READ', description: 'Consulter les rapports et statistiques', category: 'ANALYTICS' },
  { id: 'analytics-export', name: 'Exporter des rapports', resource: 'ANALYTICS', action: 'EXPORT', description: 'Exporter des rapports', category: 'ANALYTICS' },

  // Journaux d'audit
  { id: 'audit-view', name: 'Voir les journaux d\'audit', resource: 'AUDIT', action: 'READ', description: 'Consulter les journaux d\'audit', category: 'AUDIT_LOGS' },
  { id: 'audit-export', name: 'Exporter les journaux d\'audit', resource: 'AUDIT', action: 'EXPORT', description: 'Exporter les journaux d\'audit', category: 'AUDIT_LOGS' },

  // Configuration système
  { id: 'system-config-view', name: 'Voir la configuration système', resource: 'SYSTEM', action: 'READ', description: 'Consulter la configuration système', category: 'SYSTEM_CONFIG' },
  { id: 'system-config-update', name: 'Modifier la configuration système', resource: 'SYSTEM', action: 'UPDATE', description: 'Modifier la configuration système', category: 'SYSTEM_CONFIG' },
  { id: 'system-maintenance', name: 'Maintenance système', resource: 'SYSTEM', action: 'MAINTENANCE', description: 'Effectuer des opérations de maintenance', category: 'SYSTEM_CONFIG' },

  // Backup et restauration
  { id: 'backup-create', name: 'Créer des sauvegardes', resource: 'BACKUP', action: 'CREATE', description: 'Créer des sauvegardes du système', category: 'BACKUP_RESTORE' },
  { id: 'backup-restore', name: 'Restaurer des sauvegardes', resource: 'BACKUP', action: 'RESTORE', description: 'Restaurer des sauvegardes', category: 'BACKUP_RESTORE' },
  { id: 'backup-manage', name: 'Gérer les sauvegardes', resource: 'BACKUP', action: 'MANAGE', description: 'Gérer les sauvegardes existantes', category: 'BACKUP_RESTORE' },

  // Import/Export de données
  { id: 'data-import', name: 'Importer des données', resource: 'DATA', action: 'IMPORT', description: 'Importer des données dans le système', category: 'DATA_IMPORT_EXPORT' },
  { id: 'data-export', name: 'Exporter des données', resource: 'DATA', action: 'EXPORT', description: 'Exporter des données du système', category: 'DATA_IMPORT_EXPORT' },

  // Notifications
  { id: 'notification-view', name: 'Voir les notifications', resource: 'NOTIFICATION', action: 'READ', description: 'Consulter les notifications', category: 'NOTIFICATION_MANAGEMENT' },
  { id: 'notification-send', name: 'Envoyer des notifications', resource: 'NOTIFICATION', action: 'SEND', description: 'Envoyer des notifications', category: 'NOTIFICATION_MANAGEMENT' },
  { id: 'notification-manage', name: 'Gérer les notifications', resource: 'NOTIFICATION', action: 'MANAGE', description: 'Gérer les notifications système', category: 'NOTIFICATION_MANAGEMENT' }
];

const mockRoles: Role[] = [
  {
    id: 'super-admin',
    name: 'Super Administrateur',
    description: 'Accès complet à toutes les fonctionnalités du système',
    permissions: mockPermissions,
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    createdBy: 'system'
  },
  {
    id: 'admin',
    name: 'Administrateur',
    description: 'Gestion complète des utilisateurs, rôles et configuration système',
    permissions: mockPermissions.filter(p =>
      p.category !== 'BACKUP_RESTORE' ||
      (p.id !== 'backup-restore' && p.id !== 'system-maintenance')
    ),
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    createdBy: 'system'
  },
  {
    id: 'insurer-admin',
    name: 'Administrateur Assureur',
    description: 'Gestion des offres, devis et polices pour une compagnie d\'assurance',
    permissions: mockPermissions.filter(p =>
      ['OFFER_MANAGEMENT', 'QUOTE_MANAGEMENT', 'POLICY_MANAGEMENT', 'ANALYTICS', 'PAYMENT_MANAGEMENT'].includes(p.category)
    ),
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    createdBy: 'admin'
  },
  {
    id: 'insurer-agent',
    name: 'Agent Assureur',
    description: 'Gestion quotidienne des offres et devis',
    permissions: mockPermissions.filter(p =>
      (p.category === 'OFFER_MANAGEMENT' && p.action !== 'DELETE') ||
      (p.category === 'QUOTE_MANAGEMENT' && ['READ', 'RESPOND'].includes(p.action)) ||
      (p.category === 'POLICY_MANAGEMENT' && p.action === 'READ') ||
      (p.category === 'ANALYTICS' && p.action === 'READ')
    ),
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    createdBy: 'insurer-admin'
  },
  {
    id: 'user',
    name: 'Utilisateur',
    description: 'Accès client standard pour comparer des offres et gérer ses polices',
    permissions: mockPermissions.filter(p =>
      (p.category === 'OFFER_MANAGEMENT' && p.action === 'READ') ||
      (p.category === 'QUOTE_MANAGEMENT' && ['READ', 'CREATE', 'UPDATE'].includes(p.action)) ||
      (p.category === 'POLICY_MANAGEMENT' && ['READ', 'UPDATE'].includes(p.action)) ||
      (p.category === 'PAYMENT_MANAGEMENT' && p.action === 'READ')
    ),
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    createdBy: 'system'
  },
  {
    id: 'auditor',
    name: 'Auditeur',
    description: 'Accès en lecture seule pour audit et conformité',
    permissions: mockPermissions.filter(p => p.action === 'READ'),
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    createdBy: 'admin'
  }
];

const mockUserPermissions: UserPermission[] = [
  {
    userId: 'user-1',
    roleId: 'super-admin',
    additionalPermissions: [],
    revokedPermissions: []
  },
  {
    userId: 'user-2',
    roleId: 'admin',
    additionalPermissions: [
      mockPermissions.find(p => p.id === 'backup-restore')!
    ],
    revokedPermissions: []
  },
  {
    userId: 'user-3',
    roleId: 'insurer-admin',
    additionalPermissions: [],
    revokedPermissions: [
      'payment-refund'
    ]
  }
];

export const roleService = {
  async getRoles(): Promise<Role[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockRoles.sort((a, b) => a.name.localeCompare(b.name));
  },

  async getRole(id: string): Promise<Role | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockRoles.find(role => role.id === id) || null;
  },

  async createRole(role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<Role> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const newRole: Role = {
      ...role,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockRoles.push(newRole);
    return newRole;
  },

  async updateRole(id: string, updates: Partial<Role>): Promise<Role> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const roleIndex = mockRoles.findIndex(role => role.id === id);
    if (roleIndex === -1) {
      throw new Error('Rôle non trouvé');
    }

    mockRoles[roleIndex] = {
      ...mockRoles[roleIndex],
      ...updates,
      updatedAt: new Date()
    };

    return mockRoles[roleIndex];
  },

  async deleteRole(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const roleIndex = mockRoles.findIndex(role => role.id === id);
    if (roleIndex === -1) {
      throw new Error('Rôle non trouvé');
    }

    mockRoles.splice(roleIndex, 1);
  },

  async getPermissions(category?: PermissionCategory): Promise<Permission[]> {
    await new Promise(resolve => setTimeout(resolve, 300));

    if (category) {
      return mockPermissions.filter(p => p.category === category);
    }

    return mockPermissions.sort((a, b) => {
      const categoryOrder = {
        'USER_MANAGEMENT': 1,
        'ROLE_MANAGEMENT': 2,
        'OFFER_MANAGEMENT': 3,
        'QUOTE_MANAGEMENT': 4,
        'POLICY_MANAGEMENT': 5,
        'PAYMENT_MANAGEMENT': 6,
        'ANALYTICS': 7,
        'AUDIT_LOGS': 8,
        'SYSTEM_CONFIG': 9,
        'BACKUP_RESTORE': 10,
        'DATA_IMPORT_EXPORT': 11,
        'NOTIFICATION_MANAGEMENT': 12
      };

      const categoryDiff = categoryOrder[a.category] - categoryOrder[b.category];
      if (categoryDiff !== 0) return categoryDiff;

      return a.name.localeCompare(b.name);
    });
  },

  async getPermissionCategories(): Promise<{ category: PermissionCategory; label: string; description: string }[]> {
    await new Promise(resolve => setTimeout(resolve, 200));

    return [
      {
        category: 'USER_MANAGEMENT',
        label: 'Gestion des utilisateurs',
        description: 'Permissions pour la gestion des comptes utilisateurs'
      },
      {
        category: 'ROLE_MANAGEMENT',
        label: 'Gestion des rôles',
        description: 'Permissions pour la gestion des rôles et permissions'
      },
      {
        category: 'OFFER_MANAGEMENT',
        label: 'Gestion des offres',
        description: 'Permissions pour la gestion des offres d\'assurance'
      },
      {
        category: 'QUOTE_MANAGEMENT',
        label: 'Gestion des devis',
        description: 'Permissions pour la gestion des devis'
      },
      {
        category: 'POLICY_MANAGEMENT',
        label: 'Gestion des polices',
        description: 'Permissions pour la gestion des polices d\'assurance'
      },
      {
        category: 'PAYMENT_MANAGEMENT',
        label: 'Gestion des paiements',
        description: 'Permissions pour la gestion des paiements'
      },
      {
        category: 'ANALYTICS',
        label: 'Analytique',
        description: 'Permissions pour l\'accès aux rapports et statistiques'
      },
      {
        category: 'AUDIT_LOGS',
        label: 'Journaux d\'audit',
        description: 'Permissions pour l\'accès aux journaux d\'audit'
      },
      {
        category: 'SYSTEM_CONFIG',
        label: 'Configuration système',
        description: 'Permissions pour la configuration du système'
      },
      {
        category: 'BACKUP_RESTORE',
        label: 'Backup et restauration',
        description: 'Permissions pour la gestion des sauvegardes'
      },
      {
        category: 'DATA_IMPORT_EXPORT',
        label: 'Import/Export de données',
        description: 'Permissions pour l\'importation et exportation de données'
      },
      {
        category: 'NOTIFICATION_MANAGEMENT',
        label: 'Gestion des notifications',
        description: 'Permissions pour la gestion des notifications'
      }
    ];
  },

  async getUserPermissions(userId: string): Promise<UserPermission | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockUserPermissions.find(up => up.userId === userId) || null;
  },

  async assignRole(userId: string, roleId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const existingIndex = mockUserPermissions.findIndex(up => up.userId === userId);
    const userPermission: UserPermission = {
      userId,
      roleId,
      additionalPermissions: [],
      revokedPermissions: []
    };

    if (existingIndex >= 0) {
      mockUserPermissions[existingIndex] = userPermission;
    } else {
      mockUserPermissions.push(userPermission);
    }
  },

  async updateUserPermissions(userId: string, permissions: Partial<UserPermission>): Promise<UserPermission> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const existingIndex = mockUserPermissions.findIndex(up => up.userId === userId);
    if (existingIndex === -1) {
      throw new Error('Permissions utilisateur non trouvées');
    }

    mockUserPermissions[existingIndex] = {
      ...mockUserPermissions[existingIndex],
      ...permissions
    };

    return mockUserPermissions[existingIndex];
  },

  async getUserEffectivePermissions(userId: string): Promise<Permission[]> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const userPermission = await this.getUserPermissions(userId);
    if (!userPermission) {
      return [];
    }

    const role = await this.getRole(userPermission.roleId);
    if (!role) {
      return [];
    }

    let effectivePermissions = [...role.permissions];

    // Ajouter les permissions additionnelles
    if (userPermission.additionalPermissions.length > 0) {
      const additionalPermissions = await Promise.all(
        userPermission.additionalPermissions.map(ap =>
          mockPermissions.find(p => p.id === ap.id)
        ).filter(Boolean)
      );
      effectivePermissions.push(...additionalPermissions as Permission[]);
    }

    // Retirer les permissions révoquées
    effectivePermissions = effectivePermissions.filter(
      p => !userPermission.revokedPermissions.includes(p.id)
    );

    // Supprimer les doublons
    const uniquePermissions = effectivePermissions.filter((permission, index, self) =>
      index === self.findIndex(p => p.id === permission.id)
    );

    return uniquePermissions;
  },

  async checkPermission(userId: string, resource: string, action: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const effectivePermissions = await this.getUserEffectivePermissions(userId);
    return effectivePermissions.some(p =>
      p.resource === resource && p.action === action
    );
  },

  async getRoleStatistics(): Promise<{
    totalRoles: number;
    activeRoles: number;
    totalPermissions: number;
    usersByRole: { roleId: string; roleName: string; userCount: number }[];
  }> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const activeRoles = mockRoles.filter(role => role.isActive).length;

    const roleCounts = mockUserPermissions.reduce((acc, up) => {
      acc[up.roleId] = (acc[up.roleId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const usersByRole = Object.entries(roleCounts).map(([roleId, userCount]) => {
      const role = mockRoles.find(r => r.id === roleId);
      return {
        roleId,
        roleName: role?.name || 'Rôle inconnu',
        userCount
      };
    });

    return {
      totalRoles: mockRoles.length,
      activeRoles,
      totalPermissions: mockPermissions.length,
      usersByRole
    };
  }
};
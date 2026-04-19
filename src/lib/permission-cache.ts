/**
 * Cache des permissions avec TTL pour optimiser les performances
 * Évite les appels API répétés pour les permissions utilisateur
 */

interface CachedPermission {
  permissions: string[];
  timestamp: number;
}

export class PermissionCache {
  private static instance: PermissionCache;
  private cache = new Map<string, CachedPermission>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes en millisecondes

  static getInstance(): PermissionCache {
    if (!PermissionCache.instance) {
      PermissionCache.instance = new PermissionCache();
    }
    return PermissionCache.instance;
  }

  /**
   * Récupère les permissions depuis le cache ou l'API
   */
  async getUserPermissions(
    userId: string, 
    fetchFunction: () => Promise<string[]>
  ): Promise<string[]> {
    const cached = this.cache.get(userId);
    
    // Vérifier si le cache est valide
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.permissions;
    }

    // Récupérer depuis l'API
    try {
      const permissions = await fetchFunction();
      
      // Mettre en cache
      this.cache.set(userId, {
        permissions,
        timestamp: Date.now()
      });

      return permissions;
    } catch (error) {
      console.error('Error fetching permissions:', error);
      
      // Retourner les permissions en cache même si expirées en cas d'erreur
      if (cached) {
        return cached.permissions;
      }
      
      throw error;
    }
  }

  /**
   * Invalide le cache pour un utilisateur spécifique
   */
  invalidateUser(userId: string): void {
    this.cache.delete(userId);
  }

  /**
   * Invalide tout le cache
   */
  invalidateAll(): void {
    this.cache.clear();
  }

  /**
   * Nettoie les entrées expirées du cache
   */
  cleanup(): void {
    const now = Date.now();
    for (const [userId, cached] of this.cache.entries()) {
      if (now - cached.timestamp >= this.TTL) {
        this.cache.delete(userId);
      }
    }
  }

  /**
   * Vérifie si une permission est en cache
   */
  hasPermission(userId: string, permission: string): boolean {
    const cached = this.cache.get(userId);
    return cached ? cached.permissions.includes(permission) : false;
  }

  /**
   * Retourne les statistiques du cache
   */
  getStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0 // TODO: Implémenter le suivi des hits/misses
    };
  }
}

// Export singleton
export const permissionCache = PermissionCache.getInstance();

// Hook React pour le cache de permissions
export const usePermissionCache = () => {
  return {
    getUserPermissions: permissionCache.getUserPermissions.bind(permissionCache),
    invalidateUser: permissionCache.invalidateUser.bind(permissionCache),
    invalidateAll: permissionCache.invalidateAll.bind(permissionCache),
    cleanup: permissionCache.cleanup.bind(permissionCache),
    hasPermission: permissionCache.hasPermission.bind(permissionCache),
    getStats: permissionCache.getStats.bind(permissionCache)
  };
};
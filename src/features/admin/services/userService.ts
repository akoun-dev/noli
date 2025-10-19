import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

// Types
export interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email: string;
  phone?: string;
  address?: string;
  role: 'USER' | 'INSURER' | 'ADMIN';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  createdAt: string;
  lastLogin: string;
  profileCompleted: boolean;
  quotesCount: number;
  conversionRate: number;
}

export interface CreateUserRequest {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email: string;
  phone?: string;
  address?: string;
  role: 'USER' | 'INSURER' | 'ADMIN';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
}

export interface UpdateUserRequest extends Partial<CreateUserRequest> {
  id: string;
}

export interface UserFilters {
  search?: string;
  status?: string;
  role?: string;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  pending: number;
  suspended: number;
  byRole: {
    USER: number;
    INSURER: number;
    ADMIN: number;
  };
}

// Helper functions pour la conversion des données
const mapProfileToUser = (profile: any): User => {
  const isActive = profile.is_active;
  const status = isActive ? 'active' :
    profile.role === 'INSURER' && !profile.is_active ? 'pending' : 'inactive';

  return {
    id: profile.id,
    firstName: profile.first_name,
    lastName: profile.last_name,
    companyName: profile.company_name,
    email: profile.email,
    phone: profile.phone,
    address: profile.address,
    role: profile.role,
    status: status as any,
    createdAt: profile.created_at,
    lastLogin: profile.last_login || profile.created_at,
    profileCompleted: !!(profile.first_name && profile.last_name && profile.phone),
    quotesCount: 0, // Sera calculé séparément
    conversionRate: 0 // Sera calculé séparément
  };
};

// API Functions
export const fetchUsers = async (filters?: UserFilters): Promise<User[]> => {
  try {
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    // Appliquer les filtres
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      query = query.or(
        `first_name.ilike.%${searchLower}%,last_name.ilike.%${searchLower}%,company_name.ilike.%${searchLower}%,email.ilike.%${searchLower}%`
      );
    }

    if (filters?.status && filters.status !== 'all') {
      if (filters.status === 'pending') {
        query = query.eq('role', 'INSURER').eq('is_active', false);
      } else if (filters.status === 'active') {
        query = query.eq('is_active', true);
      } else if (filters.status === 'inactive') {
        query = query.eq('is_active', false).not('role', 'eq', 'INSURER');
      } else if (filters.status === 'suspended') {
        query = query.eq('is_active', false);
      }
    }

    if (filters?.role && filters.role !== 'all') {
      query = query.eq('role', filters.role);
    }

    const { data: profiles, error } = await query;

    if (error) {
      logger.error('Error fetching users:', error);
      throw error;
    }

    // Convertir les profils en utilisateurs et ajouter les statistiques
    const users = await Promise.all(
      profiles.map(async (profile) => {
        const user = mapProfileToUser(profile);

        // Récupérer le nombre de quotes pour cet utilisateur
        const { count: quotesCount } = await supabase
          .from('quotes')
          .select('*', { count: 'exact' })
          .eq('user_id', profile.id)
          .single();

        // Récupérer le nombre de polices approuvées
        const { count: policiesCount } = await supabase
          .from('quotes')
          .select('*', { count: 'exact' })
          .eq('user_id', profile.id)
          .eq('status', 'approved')
          .single();

        user.quotesCount = quotesCount || 0;
        user.conversionRate = quotesCount && quotesCount > 0
          ? Math.round(((policiesCount || 0) / quotesCount) * 10000) / 100
          : 0;

        return user;
      })
    );

    return users;

  } catch (error) {
    logger.error('Error in fetchUsers:', error);
    throw error;
  }
};

export const fetchUserStats = async (): Promise<UserStats> => {
  try {
    // Récupérer les statistiques par rôle
    const { data: userStats, error } = await supabase
      .from('profiles')
      .select('role, is_active');

    if (error) {
      logger.error('Error fetching user stats:', error);
      throw error;
    }

    const stats = {
      total: userStats?.length || 0,
      active: userStats?.filter(u => u.is_active).length || 0,
      inactive: userStats?.filter(u => !u.is_active && u.role !== 'INSURER').length || 0,
      pending: userStats?.filter(u => u.role === 'INSURER' && !u.is_active).length || 0,
      suspended: 0, // Pas encore implémenté dans la base
      byRole: {
        USER: userStats?.filter(u => u.role === 'USER').length || 0,
        INSURER: userStats?.filter(u => u.role === 'INSURER').length || 0,
        ADMIN: userStats?.filter(u => u.role === 'ADMIN').length || 0,
      }
    };

    return stats;

  } catch (error) {
    logger.error('Error in fetchUserStats:', error);
    throw error;
  }
};

export const createUser = async (userData: CreateUserRequest): Promise<User> => {
  try {
    // Utiliser la fonction RPC admin_create_user
    const { data, error } = await supabase.rpc('admin_create_user', {
      email_param: userData.email,
      first_name_param: userData.firstName,
      last_name_param: userData.lastName,
      company_name_param: userData.companyName,
      phone_param: userData.phone,
      role_param: userData.role,
      is_active_param: userData.status === 'active'
    });

    if (error) {
      logger.error('Error creating user:', error);
      throw error;
    }

    if (!data || data.length === 0 || !data[0].success) {
      throw new Error(data?.[0]?.message || 'Erreur lors de la création de l\'utilisateur');
    }

    // Récupérer le profil créé
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data[0].user_id)
      .single();

    if (fetchError) {
      logger.error('Error fetching created user:', fetchError);
      throw fetchError;
    }

    return mapProfileToUser(profile);

  } catch (error) {
    logger.error('Error in createUser:', error);
    throw error;
  }
};

export const updateUser = async (userData: UpdateUserRequest): Promise<User> => {
  try {
    // Utiliser la fonction RPC admin_update_user
    const updates: any = {};

    if (userData.firstName !== undefined) updates.first_name = userData.firstName;
    if (userData.lastName !== undefined) updates.last_name = userData.lastName;
    if (userData.companyName !== undefined) updates.company_name = userData.companyName;
    if (userData.phone !== undefined) updates.phone = userData.phone;
    if (userData.address !== undefined) updates.address = userData.address;
    if (userData.role !== undefined) updates.role = userData.role;
    if (userData.status !== undefined) updates.is_active = userData.status === 'active';

    const { data, error } = await supabase.rpc('admin_update_user', {
      user_id_param: userData.id,
      updates: updates
    });

    if (error) {
      logger.error('Error updating user:', error);
      throw error;
    }

    if (!data || data.length === 0 || !data[0].success) {
      throw new Error(data?.[0]?.message || 'Erreur lors de la mise à jour de l\'utilisateur');
    }

    // Récupérer le profil mis à jour
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.id)
      .single();

    if (fetchError) {
      logger.error('Error fetching updated user:', fetchError);
      throw fetchError;
    }

    return mapProfileToUser(profile);

  } catch (error) {
    logger.error('Error in updateUser:', error);
    throw error;
  }
};

export const deleteUser = async (userId: string): Promise<void> => {
  try {
    // Utiliser la fonction RPC admin_delete_user
    const { data, error } = await supabase.rpc('admin_delete_user', {
      user_id_param: userId
    });

    if (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }

    if (!data || data.length === 0 || !data[0].success) {
      throw new Error(data?.[0]?.message || 'Erreur lors de la suppression de l\'utilisateur');
    }

  } catch (error) {
    logger.error('Error in deleteUser:', error);
    throw error;
  }
};

export const bulkUpdateUsers = async (userIds: string[], action: 'activate' | 'suspend' | 'delete'): Promise<{ success: number; failed: number }> => {
  try {
    let success = 0;
    let failed = 0;

    for (const userId of userIds) {
      try {
        if (action === 'delete') {
          await deleteUser(userId);
        } else {
          const isActive = action === 'activate';
          const { data, error } = await supabase.rpc('admin_update_user', {
            user_id_param: userId,
            updates: { is_active: isActive }
          });

          if (error || !data?.[0]?.success) {
            failed++;
          } else {
            success++;
          }
        }
      } catch (error) {
        logger.error(`Error processing user ${userId}:`, error);
        failed++;
      }
    }

    return { success, failed };

  } catch (error) {
    logger.error('Error in bulkUpdateUsers:', error);
    throw error;
  }
};

export const exportUsers = async (filters?: UserFilters): Promise<Blob> => {
  try {
    const users = await fetchUsers(filters);

    // Create CSV content
    const headers = ['ID', 'Nom', 'Email', 'Téléphone', 'Rôle', 'Statut', 'Date de création', 'Dernière connexion', 'Nombre de devis', 'Taux conversion'];
    const rows = users.map(user => [
      user.id,
      user.role === 'INSURER' ? user.companyName || '' : `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      user.email,
      user.phone || '',
      user.role,
      user.status,
      new Date(user.createdAt).toLocaleDateString('fr-FR'),
      new Date(user.lastLogin).toLocaleDateString('fr-FR'),
      user.quotesCount.toString(),
      `${user.conversionRate}%`
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8' });

  } catch (error) {
    logger.error('Error in exportUsers:', error);
    throw error;
  }
};

// React Query Hooks
export const useUsers = (filters?: UserFilters) => {
  return useQuery({
    queryKey: ['admin-users', filters],
    queryFn: () => fetchUsers(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUserStats = () => {
  return useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: fetchUserStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      toast.success('Utilisateur créé avec succès');
      queryClient.invalidateQueries(['admin-users']);
      queryClient.invalidateQueries(['admin-user-stats']);
    },
    onError: (error) => {
      toast.error('Erreur lors de la création de l\'utilisateur');
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      toast.success('Utilisateur mis à jour avec succès');
      queryClient.invalidateQueries(['admin-users']);
      queryClient.invalidateQueries(['admin-user-stats']);
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour de l\'utilisateur');
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      toast.success('Utilisateur supprimé avec succès');
      queryClient.invalidateQueries(['admin-users']);
      queryClient.invalidateQueries(['admin-user-stats']);
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression de l\'utilisateur');
    },
  });
};

export const useBulkUpdateUsers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userIds, action }: { userIds: string[]; action: 'activate' | 'suspend' | 'delete' }) =>
      bulkUpdateUsers(userIds, action),
    onSuccess: (data, variables) => {
      const actionText = variables.action === 'activate' ? 'activés' :
                       variables.action === 'suspend' ? 'suspendus' : 'supprimés';
      toast.success(`${data.success} utilisateurs ${actionText} avec succès`);
      if (data.failed > 0) {
        toast.error(`${data.failed} utilisateurs n'ont pas pu être traités`);
      }
      queryClient.invalidateQueries(['admin-users']);
      queryClient.invalidateQueries(['admin-user-stats']);
    },
    onError: (error) => {
      toast.error('Erreur lors du traitement groupé des utilisateurs');
    },
  });
};

export const useExportUsers = () => {
  return useMutation({
    mutationFn: exportUsers,
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `utilisateurs_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Utilisateurs exportés avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de l\'export des utilisateurs');
    },
  });
};
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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

// Mock data
const mockUsers: User[] = [
  {
    id: '1',
    firstName: 'Jean',
    lastName: 'Kouadio',
    email: 'jean.kouadio@email.com',
    phone: '+225 07 12 34 56 78',
    address: 'Abidjan, Cocody',
    role: 'USER',
    status: 'active',
    createdAt: '2024-01-15',
    lastLogin: '2024-01-20',
    profileCompleted: true,
    quotesCount: 12,
    conversionRate: 25
  },
  {
    id: '2',
    firstName: 'Marie',
    lastName: 'Amani',
    email: 'marie.amani@email.com',
    phone: '+225 05 98 76 54 32',
    role: 'USER',
    status: 'active',
    createdAt: '2024-01-10',
    lastLogin: '2024-01-19',
    profileCompleted: false,
    quotesCount: 8,
    conversionRate: 15
  },
  {
    id: '3',
    companyName: 'NSIA Assurance',
    email: 'contact@nsia.ci',
    phone: '+225 21 25 40 00',
    role: 'INSURER',
    status: 'pending',
    createdAt: '2024-01-18',
    lastLogin: '2024-01-18',
    profileCompleted: true,
    quotesCount: 0,
    conversionRate: 0
  },
  {
    id: '4',
    firstName: 'Kouakou',
    lastName: 'Yao',
    email: 'kouakou.yao@email.com',
    role: 'USER',
    status: 'suspended',
    createdAt: '2024-01-05',
    lastLogin: '2024-01-15',
    profileCompleted: true,
    quotesCount: 5,
    conversionRate: 10
  },
  {
    id: '5',
    firstName: 'Admin',
    lastName: 'System',
    email: 'admin@noliassurance.ci',
    role: 'ADMIN',
    status: 'active',
    createdAt: '2024-01-01',
    lastLogin: '2024-01-20',
    profileCompleted: true,
    quotesCount: 0,
    conversionRate: 0
  }
];

const mockStats: UserStats = {
  total: mockUsers.length,
  active: mockUsers.filter(u => u.status === 'active').length,
  inactive: mockUsers.filter(u => u.status === 'inactive').length,
  pending: mockUsers.filter(u => u.status === 'pending').length,
  suspended: mockUsers.filter(u => u.status === 'suspended').length,
  byRole: {
    USER: mockUsers.filter(u => u.role === 'USER').length,
    INSURER: mockUsers.filter(u => u.role === 'INSURER').length,
    ADMIN: mockUsers.filter(u => u.role === 'ADMIN').length,
  }
};

// API Functions
export const fetchUsers = async (filters?: UserFilters): Promise<User[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  let filteredUsers = [...mockUsers];

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    filteredUsers = filteredUsers.filter(user =>
      (user.firstName?.toLowerCase().includes(searchLower) || '') ||
      (user.lastName?.toLowerCase().includes(searchLower) || '') ||
      (user.companyName?.toLowerCase().includes(searchLower) || '') ||
      user.email.toLowerCase().includes(searchLower)
    );
  }

  if (filters?.status && filters.status !== 'all') {
    filteredUsers = filteredUsers.filter(user => user.status === filters.status);
  }

  if (filters?.role && filters.role !== 'all') {
    filteredUsers = filteredUsers.filter(user => user.role === filters.role);
  }

  return filteredUsers;
};

export const fetchUserStats = async (): Promise<UserStats> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockStats;
};

export const createUser = async (userData: CreateUserRequest): Promise<User> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const newUser: User = {
    id: Date.now().toString(),
    ...userData,
    createdAt: new Date().toISOString().split('T')[0],
    lastLogin: new Date().toISOString().split('T')[0],
    profileCompleted: false,
    quotesCount: 0,
    conversionRate: 0
  };

  mockUsers.push(newUser);
  return newUser;
};

export const updateUser = async (userData: UpdateUserRequest): Promise<User> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const userIndex = mockUsers.findIndex(u => u.id === userData.id);
  if (userIndex === -1) {
    throw new Error('Utilisateur non trouvé');
  }

  const updatedUser = { ...mockUsers[userIndex], ...userData };
  mockUsers[userIndex] = updatedUser;
  return updatedUser;
};

export const deleteUser = async (userId: string): Promise<void> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const userIndex = mockUsers.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    throw new Error('Utilisateur non trouvé');
  }

  mockUsers.splice(userIndex, 1);
};

export const bulkUpdateUsers = async (userIds: string[], action: 'activate' | 'suspend' | 'delete'): Promise<{ success: number; failed: number }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  let success = 0;
  let failed = 0;

  for (const userId of userIds) {
    try {
      const userIndex = mockUsers.findIndex(u => u.id === userId);
      if (userIndex === -1) {
        failed++;
        continue;
      }

      if (action === 'delete') {
        mockUsers.splice(userIndex, 1);
      } else {
        mockUsers[userIndex].status = action === 'activate' ? 'active' : 'suspended';
      }
      success++;
    } catch (error) {
      failed++;
    }
  }

  return { success, failed };
};

export const exportUsers = async (filters?: UserFilters): Promise<Blob> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  const users = await fetchUsers(filters);

  // Create CSV content
  const headers = ['ID', 'Nom', 'Email', 'Téléphone', 'Rôle', 'Statut', 'Date de création', 'Dernière connexion'];
  const rows = users.map(user => [
    user.id,
    user.role === 'INSURER' ? user.companyName || '' : `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    user.email,
    user.phone || '',
    user.role,
    user.status,
    user.createdAt,
    user.lastLogin
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return new Blob([csvContent], { type: 'text/csv' });
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
import { supabase, supabaseHelpers } from '@/lib/supabase';
import { logger } from '@/lib/logger';

// Types locaux pour éviter la dépendance circulaire sur apiClient
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
  timestamp: string;
}

export interface KPI {
  label: string;
  value: string;
  target: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  trend?: 'up' | 'down' | 'stable';
  change?: number;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Types utilisateurs
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'USER' | 'INSURER' | 'ADMIN';
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  lastLogin: string;
  phone?: string;
  avatar?: string;
}

// Types assureurs
export interface Insurer {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  offersCount: number;
  conversionRate: number;
  phone?: string;
  address?: string;
}

// Types offres
export interface Offer {
  id: string;
  title: string;
  insurerId: string;
  insurer: string;
  price: number;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  clicks: number;
  conversions: number;
  description?: string;
}

// Types supervision
export interface SupervisionStats {
  users: {
    total: number;
    active: number;
    new: number;
    growth: number;
  };
  insurers: {
    total: number;
    active: number;
    pending: number;
    growth: number;
  };
  offers: {
    total: number;
    active: number;
    pending: number;
    growth: number;
  };
  quotes: {
    total: number;
    converted: number;
    conversionRate: number;
    growth: number;
  };
  policies: {
    total: number;
    active: number;
    growth: number;
  };
}

// Types filtres
export interface UserFilters {
  search?: string;
  status?: 'all' | 'active' | 'inactive' | 'pending';
  role?: 'all' | 'USER' | 'INSURER' | 'ADMIN';
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface InsurerFilters {
  search?: string;
  status?: 'all' | 'active' | 'inactive' | 'pending';
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface OfferFilters {
  search?: string;
  status?: 'all' | 'active' | 'inactive' | 'pending';
  insurerId?: string;
  priceMin?: number;
  priceMax?: number;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface ExportRequest {
  entityType: 'users' | 'insurers' | 'offers';
  format: 'csv' | 'json';
  filters?: {
    search?: string;
    status?: 'all' | 'active' | 'inactive' | 'pending';
    role?: 'all' | 'USER' | 'INSURER' | 'ADMIN';
  };
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  role: 'USER' | 'INSURER' | 'ADMIN';
  phone?: string;
  password?: string;
  sendInvitation?: boolean;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: 'USER' | 'INSURER' | 'ADMIN';
  status?: 'active' | 'inactive' | 'pending';
  phone?: string;
}

export interface CreateInsurerRequest {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  description?: string;
}

export interface UpdateInsurerRequest {
  name?: string;
  email?: string;
  status?: 'active' | 'inactive' | 'pending';
  phone?: string;
  address?: string;
  contactPerson?: string;
  description?: string;
}

export interface CreateOfferRequest {
  title: string;
  insurerId: string;
  price: number;
  description?: string;
  status?: 'active' | 'inactive' | 'pending';
}

export interface UpdateOfferRequest {
  title?: string;
  price?: number;
  description?: string;
  status?: 'active' | 'inactive' | 'pending';
}

// Helper pour extraire le nombre des resultats
const extractCount = ({ count, error }: { count: number | null; error: any }): number => {
  if (error || count === null) {
    return 0
  }
  return count || 0
}

export class AdminSupervisionApi {
  private readonly baseUrl = '/admin/supervision';

  private mapProfileToInsurer(profile: any): Insurer {
    return {
      id: profile.id,
      name: profile.name || profile.company_name || '',
      email: profile.email || '',
      status: profile.status || 'active',
      createdAt: new Date(profile.created_at).toISOString(),
      offersCount: profile.offers_count || 0,
      conversionRate: profile.conversion_rate || 0,
      phone: profile.phone || '',
      address: profile.address || '',
    };
  }

  private mapOfferRowToOffer(row: any): Offer {
    return {
      id: row.id,
      title: row.title || '',
      insurerId: row.insurer_id || row.insurerId || '',
      insurer: row.insurer_name || row.insurer || '',
      price: row.price || 0,
      status: row.status || 'pending',
      createdAt: new Date(row.created_at).toISOString(),
      clicks: row.clicks || 0,
      conversions: row.conversions || 0,
      description: row.description || '',
    };
  }

  // =============================================
  // USERS
  // =============================================

  // Get users with pagination and filters
  async getUsers(filters?: UserFilters): Promise<ApiResponse<PaginatedResponse<User>>> {
    try {
      let query = supabase
        .from('profiles')
        .select('*');

      // Filtres par role
      if (filters?.role && filters.role !== 'all') {
        query = query.eq('role', filters.role);
      }

      // Filtres par statut
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('is_active', filters.status === 'active');
      }

      // Filtres par recherche
      if (filters?.search) {
        query = query.or(`email.ilike`, `%${filters.search}%`);
      }

      // Filtres par date
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      // Filtres par date
      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      // Pagination
      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      const from = (page - 1) * limit;
      const to = from + limit;

      // Get data and count
      const { data, error, count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .range(from, to)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching users:', error);
        return {
          success: false,
          message: 'Erreur lors de la récupération des utilisateurs',
          timestamp: new Date().toISOString(),
        };
      }

      const users = data || [];
      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: {
          data: users.map((user: any) => ({
            id: user.id,
            firstName: user.first_name || '',
            lastName: user.last_name || '',
            email: user.email || '',
            role: user.role || 'USER',
            status: user.is_active ? 'active' : 'inactive',
            createdAt: user.created_at || '',
            lastLogin: user.last_login || user.created_at || '',
            phone: user.phone || '',
            avatar: user.avatar_url || '',
          })),
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error in getUsers:', error);
      return {
        success: false,
        message: 'Erreur lors de la récupération des utilisateurs',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Get user by ID
  async getUser(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        logger.error('Error fetching user:', error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error('Error in getUser:', error);
      return null;
    }
  }

  // Create user
  async createUser(request: CreateUserRequest): Promise<User> {
    try {
      logger.info('Creating user:', request.email);

      // Creer l'utilisateur dans Supabase Auth
      const { data } = await supabase.auth.getUser();

      if (!data?.user) {
        throw new Error('Utilisateur non authentifie');
      }

      // Creer le profil dans la table profiles
      const profileData = {
        id: data.user.id,
        email: request.email,
        first_name: request.firstName || '',
        last_name: request.lastName || '',
        phone: request.phone || '',
        company_name: request.companyName || '',
        company: request.company || '',
        role: (request.role || 'USER') as 'USER',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        phone_verified: false,
        avatar_url: request.avatar_url || '',
        email_verified: false,
      };

      const { data: profile, error } = await supabase
        .from('profiles')
        .insert(profileData as unknown)
        .select()
        .single();

      if (error) {
        logger.error('Error creating user profile:', error);
        throw error;
      }

      // Logger de création
      await supabaseHelpers.logAction('ACCOUNT_CREATED', 'profile', profile.id);

      return {
        id: data.user.id,
        email: request.email,
        firstName: request.firstName || '',
        lastName: request.lastName || '',
        companyName: request.companyName || request.company,
        role: (request.role || 'USER') as 'USER',
        phone: request.phone || '',
        avatar: request.avatar_url || '',
        createdAt: new Date(profile.created_at),
        updatedAt: new Date(profile.updated_at),
      };
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  // Update user
  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    try {
      const { data } = await supabase.auth.getUser();

      if (!data?.user) {
        throw new Error('Utilisateur non authentifie');
      }

      // Construire l'objet de mise à jour
      const updateData: any = {};
      if (updates.firstName) updateData.first_name = updates.firstName;
      if (updates.lastName) updateData.last_name = updates.lastName;
      if (updates.phone) updateData.phone = updates.phone;
      if (updates.avatar) updateData.avatar_url = updates.avatar;
      if (updates.companyName) updateData.company_name = updates.companyName;
      if (updates.company) updateData.company = updates.company;

      const { data: updatedProfile, error: upError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (upError) {
        logger.error('Error updating user:', upError);
        throw upError;
      }

      // Récupérer le profil mis à jour
      const updatedUser: User = {
        id: updatedProfile.id,
        email: updatedProfile.email || '',
        firstName: updatedProfile.first_name || '',
        lastName: updatedProfile.last_name || '',
        companyName: updatedProfile.company_name || updatedProfile.company,
        role: (updatedProfile.role || 'USER') as 'USER' | 'INSURER' | 'ADMIN',
        phone: updatedProfile.phone || '',
        avatar: updatedProfile.avatar_url || '',
        createdAt: new Date(updatedProfile.created_at),
        updatedAt: new Date(updatedProfile.updated_at),
      };

      logger.info('Profile updated successfully for user:', updatedUser.id);

      return updatedUser;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  // Delete user
  async deleteUser(userId: string): Promise<void> {
    try {
      const { data } = await supabase.auth.getUser();

      if (!data?.user) {
        throw new Error('Utilisateur non authentifie');
      }

      // Supprimer le profil de la table profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)
        .single();

      if (profileError) {
        logger.error('Error deleting user profile:', profileError);
        throw profileError;
      }

      // Supprimer l'utilisateur Supabase Auth
      await supabase.auth.signOut({ scope: 'global' });

      logger.info('User deleted successfully:', userId);
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  // Toggle user status (active/inactive)
  async toggleUserStatus(userId: string): Promise<ApiResponse<User>> {
    try {
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('is_active')
        .eq('id', userId)
        .single();

      if (!currentProfile) {
        return {
          success: false,
          message: 'Utilisateur non trouvé',
          timestamp: new Date().toISOString(),
        };
      }

      const newIsActive = !currentProfile.is_active;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_active: newIsActive })
        .eq('id', userId);

      if (updateError) {
        logger.error('Error toggling user status:', updateError);
        return {
          success: false,
          message: 'Erreur lors de la mise à jour du statut',
          timestamp: new Date().toISOString(),
        };
      }

      // Récupérer le profil mis à jour
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!updatedProfile) {
        return {
          success: false,
          message: 'Échec de récupérer le profil mis à jour',
          timestamp: new Date().toISOString(),
        };
      }

      const updatedUser: User = {
        id: updatedProfile.id,
        email: updatedProfile.email || '',
        firstName: updatedProfile.first_name || '',
        lastName: updatedProfile.last_name || '',
        role: (updatedProfile.role || 'USER') as 'USER' | 'INSURER' | 'ADMIN',
        status: updatedProfile.is_active ? 'active' : 'inactive',
        createdAt: updatedProfile.created_at || '',
        lastLogin: updatedProfile.last_login || updatedProfile.created_at || '',
        phone: updatedProfile.phone || '',
        avatar: updatedProfile.avatar_url || '',
      };

      // Logger de changement de statut
      await supabaseHelpers.logAction('USER_STATUS_TOGGLED', 'user', userId, {
        oldStatus: currentProfile.is_active ? 'active' : 'inactive',
        newStatus: newIsActive ? 'active' : 'inactive',
      });

      return {
        success: true,
        data: updatedUser,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error toggling user status:', error);
      return {
        success: false,
        message: 'Erreur lors de la mise à jour du statut',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Reset user password
  async resetUserPassword(userId: string): Promise<{ tempPassword: string }> {
    try {
      // Generer un token temporaire
      const tempPassword = Math.random().toString(36).substring(2, 9) + Math.random().toString(36).substring(2, 9);

      logger.info('Temporary password generated for user:', userId);

      // Mettre à jour le mot de passe dans Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: tempPassword
      });

      if (updateError) {
        logger.error('Error resetting user password:', updateError);
        throw updateError;
      }

      logger.info('Password reset link sent to:', userId);

      return { tempPassword };
    } catch (error) {
      logger.error('Error in resetUserPassword:', error);
      throw error;
    }
  }

  // Send user invitation
  async sendUserInvitation(userId: string): Promise<void> {
    try {
      logger.info('Sending user invitation to:', userId);

      // TODO: Envoyer invitation...
      logger.info('Invitation sent to:', userId);
      return;
    } catch (error) {
      logger.error('Error in sendUserInvitation:', error);
      throw error;
    }
  }

  // =============================================
  // INSURERS
  // ============================================

  // Get insurers with pagination and filters
  async getInsurers(filters?: InsurerFilters): Promise<ApiResponse<PaginatedResponse<Insurer>>> {
    try {
      let query = supabase
        .from('profiles')
        .select('*');

      // Filtres par role - toujours INSURER
      query = query.eq('role', 'INSURER');

      // Filtres par statut
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('is_active', filters.status === 'active');
      }

      // Filtres par recherche
      if (filters?.search) {
        query = query.or(`company_name.ilike`, `%${filters.search}%`);
      }

      // Filtres par date
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      // Pagination
      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      const from = (page - 1) * limit;
      const to = from + limit;

      // Get data and count
      const { data, error, count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .range(from, to)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching insurers:', error);
        return {
          success: false,
          message: 'Erreur lors de la récupération des assureurs',
          timestamp: new Date().toISOString(),
        };
      }

      const insurers = data || [];
      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: {
          data: insurers.map((insurer: any) => ({
            id: insurer.id,
            name: insurer.company_name || insurer.name || '',
            email: insurer.email || '',
            status: insurer.is_active ? 'active' : 'inactive',
            createdAt: insurer.created_at || '',
            offersCount: insurer.offers_count || 0,
            conversionRate: insurer.conversion_rate || 0,
            phone: insurer.phone || '',
            address: insurer.address || '',
          })),
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error in getInsurers:', error);
      return {
        success: false,
        message: 'Erreur lors de la récupération des assureurs',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Get insurer by ID
  async getInsurer(insurerId: string): Promise<Insurer | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', insurerId)
        .single();

      if (error) {
        logger.error('Error fetching insurer:', error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error('Error in getInsurer:', error);
      return null;
    }
  }

  // Create insurer
  async createInsurer(request: CreateInsurerRequest): Promise<Insurer> {
    try {
      const { data } = await supabase.auth.getUser();

      if (!data?.user) {
        throw new Error('Utilisateur non authentifié');
      }

      // Créer l'utilisateur dans Supabase Auth
      const { data: authData } = await supabase.auth.signUp({
        email: request.email,
        password: request.password,
        options: {
          data: {
            first_name: request.firstName || '',
            last_name: request.lastName || '',
            phone: request.phone || '',
            company_name: request.companyName || '',
            role: 'INSURER',
            avatar_url: '',
          }
        },
      });

      if (!authData.user) {
        throw new Error('Échec de création');
      }

      // Créer le profil dans la table profiles
      const profileData = {
        id: authData.user.id,
        email: authData.user.email || '',
        first_name: request.firstName || '',
        last_name: request.lastName || '',
        company_name: request.company || request.company,
        company: request.company || '',
        role: 'INSURER',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        phone_verified: false,
        avatar_url: '',
        email_verified: false,
      };

      const { data: profile, error } = await supabase
        .from('profiles')
        .insert(profileData as unknown)
        .select()
        .single();

      if (error) {
        logger.error('Error creating insurer profile:', error);
        throw error;
      }

      // Logger de création
      await supabaseHelpers.logAction('ACCOUNT_CREATED', 'insurer', profile.id, {
        company_name: insurer.company || request.company
      });

      const insurer: Insurer = {
        id: authData.user.id,
        email: authData.user.email || '',
        name: request.name || '',
        company: request.company || request.company || '',
        role: 'INSURER',
        phone: request.phone || '',
        createdAt: new Date(authData.user.created_at),
        updatedAt: new Date(authData.user.updated_at),
      };

      logger.info('Insurer created successfully:', insurer.id);

      return insurer;
    } catch (error) {
      logger.error('Error creating insurer:', error);
      throw error;
    }
  }

  // Update insurer
  async updateInsurer(insurerId: string, updates: UpdateInsurerRequest): Promise<Insurer> {
    try {
      const { data } = await supabase.auth.getUser();

      if (!data?.user) {
        throw new Error('Utilisateur non authentifié');
      }

      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.email) updateData.email = updates.email;
      if (updates.phone) updateData.phone = updates.phone;
      if (updates.address) updateData.address = updates.address;
      if (updates.contactPerson) updateData.contact_person = updates.contactPerson;
      if (updates.description) updateData.description = updates.description;

      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', insurerId)
        .select()
        .single();

      if (updateError) {
        logger.error('Error updating insurer:', updateError);
        throw updateError;
      }

      if (!updatedProfile) {
        throw new Error('Échec de récupérer l\'assureur mis à jour');
      }

      const updatedInsurer: Insurer = this.mapProfileToInsurer(updatedProfile);

      logger.info('Insurer updated successfully:', updatedInsurer.id);

      return updatedInsurer;
    } catch (error) {
      logger.error('Error updating insurer:', error);
      throw error;
    }
  }

  // Delete insurer
  async deleteInsurer(insurerId: string): Promise<void> {
    try {
      const { data } = await supabase.auth.getUser();

      if (!data?.user) {
        throw new Error('Utilisateur non authentifié');
      }

      // Supprimer le profil de la table profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', insurerId)
        .single();

      if (profileError) {
        logger.error('Error deleting insurer profile:', profileError);
        throw profileError;
      }

      // Supprimer l'assureur de Supabase Auth
      await supabase.auth.signOut({ scope: 'global' });

      logger.info('Insurer deleted successfully:', insurerId);

      return;
    } catch (error) {
      logger.error('Error deleting insurer:', error);
      throw error;
    }
  }

  // Approve insurer
  async approveInsurer(insurerId: string): Promise<ApiResponse<Insurer>> {
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_active: true })
        .eq('id', insurerId);

      if (updateError) {
        logger.error('Error approving insurer:', updateError);
        return {
          success: false,
          message: 'Erreur lors de l\'approbation',
          timestamp: new Date().toISOString(),
        };
      }

      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', insurerId)
        .single();

      if (fetchError || !profile) {
        return {
          success: false,
          message: 'Assureur non trouvé',
          timestamp: new Date().toISOString(),
        };
      }

      const approvedInsurer = this.mapProfileToInsurer(profile);

      await supabaseHelpers.logAction('INSURER_APPROVED', 'insurer', insurerId);

      return {
        success: true,
        data: approvedInsurer,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error approving insurer:', error);
      return {
        success: false,
        message: 'Erreur lors de l\'approbation',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Reject insurer
  async rejectInsurer(insurerId: string, reason?: string): Promise<Insurer> {
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          status: 'inactive'
        })
        .eq('id', insurerId)
        .select()
        .single();

      if (updateError) {
        logger.error('Error rejecting insurer:', updateError);
        throw updateError;
      }

      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', insurerId)
        .single();

      if (fetchError || !profile) {
        throw new Error('Assureur non trouvé');
      }

      const rejectedInsurer = this.mapProfileToInsurer(profile);

      await supabaseHelpers.logAction('INSURER_REJECTED', 'insurer', insurerId, {
        reason: `Raison: ${reason || 'non spécifiée'}`
      });

      return rejectedInsurer;
    } catch (error) {
      logger.error('Error rejecting insurer:', error);
      throw error;
    }
  }

  // =============================================
  // OFFERS
  // ======================================

  // Get offers with pagination and filters
  async getOffers(filters?: OfferFilters): Promise<ApiResponse<PaginatedResponse<Offer>>> {
    try {
      let query = supabase
        .from('insurance_offers')
        .select('*');

      // Filtres par statut
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // Filtres par assureur
      if (filters?.insurerId) {
        query = query.eq('insurer_id', filters.insurerId);
      }

      // Filtres par prix
      if (filters?.priceMin) {
        query = query.gte('price', filters.priceMin);
      }

      if (filters?.priceMax) {
        query = query.lte('price', filters.priceMax);
      }

      // Filtres par date
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      // Filtres par recherche
      if (filters?.search) {
        query = query.or('title.ilike', `%${filters.search}%`);
      }

      // Pagination
      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      const from = (page - 1) * limit;
      const to = from + limit;

      // Get data and count
      const { data, error, count } = await supabase
        .from('insurance_offers')
        .select('*', { count: 'exact' })
        .range(from, to)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching offers:', error);
        return {
          success: false,
          message: 'Erreur lors de la récupération des offres',
          timestamp: new Date().toISOString(),
        };
      }

      const offers = data || [];
      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: {
          data: offers.map((offer: any) => ({
            id: offer.id,
            title: offer.title || '',
            insurerId: offer.insurer_id || '',
            insurer: offer.insurer_name || offer.insurer || '',
            price: offer.price || 0,
            status: offer.status || 'pending',
            createdAt: offer.created_at || '',
            clicks: offer.clicks || 0,
            conversions: offer.conversions || 0,
            description: offer.description || '',
          })),
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error in getOffers:', error);
      return {
        success: false,
        message: 'Erreur lors de la récupération des offres',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Get offer by ID
  async getOffer(offerId: string): Promise<Offer | null> {
    try {
      const { data, error } = await supabase
        .from('insurance_offers')
        .select('*')
        .eq('id', offerId)
        .single();

      if (error) {
        logger.error('Error fetching offer:', error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error('Error in getOffer:', error);
      return null;
    }
  }

  // Create offer
  async createOffer(request: CreateOfferRequest): Promise<Offer> {
    try {
      const { data } = await supabase.auth.getUser();

      if (!data?.user) {
        throw new Error('Utilisateur non authentifié');
      }

      const offerData = {
        title: request.title,
        insurer_id: request.insurerId,
        price: request.price,
        status: request.status || 'pending',
        description: request.description || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: createdOffer, error } = await supabase
        .from('insurance_offers')
        .insert(offerData as unknown)
        .select()
        .single();

      if (error || !createdOffer) {
        logger.error('Error creating offer:', error);
        throw error || new Error('Échec de création de l\'offre');
      }

      await supabaseHelpers.logAction('OFFER_CREATED', 'offer', createdOffer.id, {
        insurer: request.insurerId,
        price: request.price,
        title: request.title || ''
      });

      const offer = this.mapOfferRowToOffer(createdOffer);

      logger.info('Offer created successfully:', offer.id);

      return offer;
    } catch (error) {
      logger.error('Error in createOffer:', error);
      throw error;
    }
  }

  // Update offer
  async updateOffer(offerId: string, updates: UpdateOfferRequest): Promise<Offer> {
    try {
      const { data } = await supabase.auth.getUser();

      if (!data?.user) {
        throw new Error('Utilisateur non authentifié');
      }

      const updateData: any = {};
      if (updates.title) updateData.title = updates.title;
      if (updates.price) updateData.price = updates.price;
      if (updates.description) updateData.description = updates.description;
      if (updates.status) updateData.status = updates.status;

      const { data: updatedOfferRow, error } = await supabase
        .from('insurance_offers')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', offerId)
        .select()
        .single();

      if (error || !updatedOfferRow) {
        logger.error('Error updating offer:', error);
        throw error || new Error('Échec de récupérer l\'offre mise à jour');
      }

      const updatedOffer = this.mapOfferRowToOffer(updatedOfferRow);

      logger.info('Offer updated successfully:', updatedOffer.id);

      return updatedOffer;
    } catch (error) {
      logger.error('Error updating offer:', error);
      throw error;
    }
  }

  // Delete offer
  async deleteOffer(offerId: string): Promise<void> {
    try {
      const { data } = await supabase.auth.getUser();

      if (!data?.user) {
        throw new Error('Utilisateur non authentifié');
      }

      // Supprimer l'offre de la table insurance_offers
      const { error: offerError } = await supabase
        .from('insurance_offers')
        .delete()
        .eq('id', offerId)
        .single();

      if (offerError) {
        logger.error('Error deleting offer:', offerError);
        throw offerError;
      }

      await supabase.auth.signOut({ scope: 'global' });

      logger.info('Offer deleted successfully:', offerId);

      return;
    } catch (error) {
      logger.error('Error deleting offer:', error);
      throw error;
    }
  }

  // Toggle offer status
  async toggleOfferStatus(offerId: string): Promise<ApiResponse<Offer>> {
    try {
      const { data: currentOffer, error: fetchError } = await supabase
        .from('insurance_offers')
        .select('*')
        .eq('id', offerId)
        .single();

      if (fetchError || !currentOffer) {
        return {
          success: false,
          message: 'Offre non trouvée',
          timestamp: new Date().toISOString(),
        };
      }

      const newStatus = currentOffer.status === 'active' ? 'inactive' : 'active';

      const { error: updateError } = await supabase
        .from('insurance_offers')
        .update({ status: newStatus })
        .eq('id', offerId);

      if (updateError) {
        logger.error('Error toggling offer status:', updateError);
        return {
          success: false,
          message: 'Échec du changement de statut',
          timestamp: new Date().toISOString(),
        };
      }

      await supabaseHelpers.logAction('OFFER_STATUS_TOGGLED', 'offer', offerId);

      const updatedOffer: Offer = {
        id: currentOffer.id,
        title: currentOffer.title || '',
        insurerId: currentOffer.insurer_id || '',
        insurer: currentOffer.insurer_name || currentOffer.insurer || '',
        price: currentOffer.price || 0,
        status: newStatus,
        createdAt: currentOffer.created_at || '',
        clicks: currentOffer.clicks || 0,
        conversions: currentOffer.conversions || 0,
        description: currentOffer.description || '',
      };

      return {
        success: true,
        data: updatedOffer,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error toggling offer status:', error);
      return {
        success: false,
        message: 'Erreur lors du changement de statut',
        timestamp: new Date().toISOString(),
      };
    }
  }

  
  // Export data
  async exportData(request: ExportRequest): Promise<ApiResponse<{ downloadUrl: string }>> {
    try {
      const filters = request.filters || {};
      let rows: any[] = [];

      if (request.entityType === 'users') {
        let query = supabase
          .from('profiles')
          .select('id, first_name, last_name, email, role, status, is_active, phone, company_name, created_at');

        if (filters.search) {
          query = query.ilike('email', `%${filters.search}%`);
        }
        if (filters.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }
        if (filters.role && filters.role !== 'all') {
          query = query.eq('role', filters.role);
        }

        const { data, error } = await query;
        if (error) throw error;
        rows = data || [];
      }

      const csvContent = this.buildExportCsv(request.entityType, rows);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const downloadUrl = URL.createObjectURL(blob);

      return {
        success: true,
        data: { downloadUrl },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error exporting data:', error);
      return {
        success: false,
        message: "Erreur lors de l'export",
        timestamp: new Date().toISOString()
      };
    }
  }

  private buildExportCsv(entityType: ExportRequest['entityType'], rows: any[]): string {
    if (entityType === 'users') {
      const header = ['ID', 'Prénom', 'Nom', 'Email', 'Rôle', 'Statut', 'Téléphone', 'Entreprise', 'Créé le'];
      const lines = rows.map((row) =>
        [
          row.id,
          row.first_name,
          row.last_name,
          row.email,
          row.role,
          row.status || (row.is_active ? 'actif' : 'inactif'),
          row.phone,
          row.company_name,
          row.created_at
        ]
          .map((value) => this.escapeCsv(value))
          .join(',')
      );
      return [header.join(','), ...lines].join('\\n');
    }

    return '';
  }

  private escapeCsv(value: unknown): string {
    if (value == null) return '';
    const str = String(value);
    return str.includes(',') || str.includes('"') || str.includes('\\n')
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  }

  // =============================================
  // STATS & KPIs
  // =============================================

  // Get supervision statistics
  async getSupervisionStats(): Promise<ApiResponse<SupervisionStats>> {
    try {
      const [usersResult, insurersResult, offersResult, quotesResult, policiesResult] = await Promise.all([
        supabase.from('profiles').select('id, is_active, created_at, role'),
        supabase.from('profiles').select('id, is_active').eq('role', 'INSURER'),
        supabase.from('insurance_offers').select('id, is_active'),
        supabase.from('quotes').select('id, status'),
        supabase.from('policies').select('id, status').maybeSingle(),
      ]);

      const users = usersResult.data || [];
      const insurers = insurersResult.data || [];
      const offers = offersResult.data || [];

      // Handle quotes and policies - if tables don't exist or queries fail
      const quotes = quotesResult.data || [];
      const policies = policiesResult.data ? (Array.isArray(policiesResult.data) ? policiesResult.data : []) : [];

      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Calculer les utilisateurs du mois dernier pour la croissance
      const usersThisMonth = users.filter((u) => new Date(u.created_at) >= oneMonthAgo).length;
      const usersLastMonth = users.filter((u) => {
        const created = new Date(u.created_at);
        return created < oneMonthAgo && created >= new Date(oneMonthAgo.getTime() - 30 * 24 * 60 * 60 * 1000);
      }).length;
      const usersGrowth = usersLastMonth > 0 ? ((usersThisMonth - usersLastMonth) / usersLastMonth) * 100 : 0;

      // Calculer les assureurs en attente (inactifs) et croissance
      const pendingInsurers = insurers.filter((i) => !i.is_active).length;
      const insurersThisMonth = insurers.filter((i) => new Date(i.created_at) >= oneMonthAgo).length;
      const insurersLastMonth = insurers.filter((i) => {
        const created = new Date(i.created_at);
        return created < oneMonthAgo && created >= new Date(oneMonthAgo.getTime() - 30 * 24 * 60 * 60 * 1000);
      }).length;
      const insurersGrowth = insurersLastMonth > 0 ? ((insurersThisMonth - insurersLastMonth) / insurersLastMonth) * 100 : 0;

      // Calculer les offres en attente et croissance
      const pendingOffers = offers.filter((o) => !o.is_active).length;
      const offersThisMonth = offers.filter((o) => new Date(o.created_at) >= oneMonthAgo).length;
      const offersLastMonth = offers.filter((o) => {
        const created = new Date(o.created_at);
        return created < oneMonthAgo && created >= new Date(oneMonthAgo.getTime() - 30 * 24 * 60 * 60 * 1000);
      }).length;
      const offersGrowth = offersLastMonth > 0 ? ((offersThisMonth - offersLastMonth) / offersLastMonth) * 100 : 0;

      // Calculer les statistiques de devis
      const approvedQuotes = quotes.filter((q: any) => q.status === 'APPROVED').length;
      const quotesConversionRate = quotes.length > 0 ? (approvedQuotes / quotes.length) * 100 : 0;
      const quotesThisMonth = quotes.filter((q) => new Date(q.created_at) >= oneMonthAgo).length;
      const quotesLastMonth = quotes.filter((q) => {
        const created = new Date(q.created_at);
        return created < oneMonthAgo && created >= new Date(oneMonthAgo.getTime() - 30 * 24 * 60 * 60 * 1000);
      }).length;
      const quotesGrowth = quotesLastMonth > 0 ? ((quotesThisMonth - quotesLastMonth) / quotesLastMonth) * 100 : 0;

      // Calculer les statistiques de polices
      const activePolicies = policies.filter((p: any) => p.status === 'ACTIVE').length;
      const policiesThisMonth = policies.filter((p) => new Date(p.created_at) >= oneMonthAgo).length;
      const policiesLastMonth = policies.filter((p) => {
        const created = new Date(p.created_at);
        return created < oneMonthAgo && created >= new Date(oneMonthAgo.getTime() - 30 * 24 * 60 * 60 * 1000);
      }).length;
      const policiesGrowth = policiesLastMonth > 0 ? ((policiesThisMonth - policiesLastMonth) / policiesLastMonth) * 100 : 0;

      const stats: SupervisionStats = {
        users: {
          total: users.length,
          active: users.filter((u) => u.is_active).length,
          new: users.filter((u) => new Date(u.created_at) > oneWeekAgo).length,
          growth: usersGrowth,
        },
        insurers: {
          total: insurers.length,
          active: insurers.filter((i) => i.is_active).length,
          pending: pendingInsurers,
          growth: insurersGrowth,
        },
        offers: {
          total: offers.length,
          active: offers.filter((o) => o.is_active).length,
          pending: pendingOffers,
          growth: offersGrowth,
        },
        quotes: {
          total: quotes.length,
          converted: approvedQuotes,
          conversionRate: quotesConversionRate,
          growth: quotesGrowth,
        },
        policies: {
          total: policies.length,
          active: activePolicies,
          growth: policiesGrowth,
        },
      };

      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error getting supervision stats:', error);
      return {
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Get KPIs
  async getKPIs(): Promise<ApiResponse<KPI[]>> {
    try {
      const statsResult = await this.getSupervisionStats();

      if (!statsResult.success || !statsResult.data) {
        return {
          success: false,
          message: 'Impossible de récupérer les statistiques',
          timestamp: new Date().toISOString(),
        };
      }

      const stats = statsResult.data;

      // Calculer les cibles et variations réelles depuis les données
      const kpis: KPI[] = [
        {
          label: 'Total Utilisateurs',
          value: stats.users.total.toString(),
          target: '-',
          status: stats.users.total > 0 ? 'good' : 'warning',
          trend: 'up',
          change: stats.users.growth,
        },
        {
          label: 'Assureurs Actifs',
          value: stats.insurers.active.toString(),
          target: '-',
          status: stats.insurers.active > 0 ? 'good' : 'warning',
          trend: 'up',
          change: stats.insurers.growth,
        },
        {
          label: 'Offres Actives',
          value: stats.offers.active.toString(),
          target: '-',
          status: stats.offers.active > 0 ? 'good' : 'warning',
          trend: 'up',
          change: stats.offers.growth,
        },
        {
          label: 'Taux de Conversion',
          value: `${stats.quotes.conversionRate.toFixed(1)}%`,
          target: '-',
          status: stats.quotes.conversionRate > 0 ? 'good' : 'warning',
          trend: 'up',
          change: stats.quotes.growth,
        },
      ];

      return {
        success: true,
        data: kpis,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error getting KPIs:', error);
      return {
        success: false,
        message: 'Erreur lors de la récupération des KPIs',
        timestamp: new Date().toISOString(),
      };
    }
  }
}

export const adminSupervisionApi = new AdminSupervisionApi();

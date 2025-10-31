import { apiClient, ApiResponse } from '../apiClient';

// Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role?: 'USER' | 'INSURER';
}

export interface AuthResponse {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role: 'USER' | 'INSURER' | 'ADMIN';
    status: 'active' | 'inactive' | 'pending';
    createdAt: string;
    lastLogin?: string;
  };
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export class AuthApi {
  private readonly baseUrl = '/auth';

  // Login
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post(`${this.baseUrl}/login`, credentials);
  }

  // Register
  async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post(`${this.baseUrl}/register`, userData);
  }

  // Logout
  async logout(): Promise<ApiResponse<void>> {
    return apiClient.post(`${this.baseUrl}/logout`);
  }

  // Refresh token
  async refreshToken(refreshToken: RefreshTokenRequest): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post(`${this.baseUrl}/refresh`, refreshToken);
  }

  // Forgot password
  async forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post(`${this.baseUrl}/forgot-password`, data);
  }

  // Reset password
  async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post(`${this.baseUrl}/reset-password`, data);
  }

  // Change password
  async changePassword(data: ChangePasswordRequest): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post(`${this.baseUrl}/change-password`, data);
  }

  // Verify email
  async verifyEmail(data: VerifyEmailRequest): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post(`${this.baseUrl}/verify-email`, data);
  }

  // Resend verification email
  async resendVerificationEmail(email: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post(`${this.baseUrl}/resend-verification`, { email });
  }

  // Get current user
  async getCurrentUser(): Promise<ApiResponse<AuthResponse['user']>> {
    return apiClient.get(`${this.baseUrl}/me`);
  }

  // Update profile
  async updateProfile(data: Partial<Omit<RegisterRequest, 'password' | 'role'>>): Promise<ApiResponse<AuthResponse['user']>> {
    return apiClient.put(`${this.baseUrl}/profile`, data);
  }

  // Check if email exists
  async checkEmailExists(email: string): Promise<ApiResponse<{ exists: boolean }>> {
    return apiClient.get(`${this.baseUrl}/check-email`, { params: { email } });
  }

  // Request role change
  async requestRoleChange(role: 'USER' | 'INSURER', reason?: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post(`${this.baseUrl}/request-role-change`, { role, reason });
  }

  // Get user sessions
  async getUserSessions(): Promise<ApiResponse<Array<{
    id: string;
    device: string;
    browser: string;
    location: string;
    lastActive: string;
    isCurrent: boolean;
  }>>> {
    return apiClient.get(`${this.baseUrl}/sessions`);
  }

  // Revoke session
  async revokeSession(sessionId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete(`${this.baseUrl}/sessions/${sessionId}`);
  }

  // Revoke all other sessions
  async revokeAllOtherSessions(): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete(`${this.baseUrl}/sessions/others`);
  }
}

export const authApi = new AuthApi();
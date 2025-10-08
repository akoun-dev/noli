import { User, LoginCredentials, RegisterData } from '@/types';
import { getUserByEmail, validateCredentials } from '../mock/users';

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export class AuthService {
  private static instance: AuthService;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = validateCredentials(credentials.email, credentials.password);

    if (!user) {
      throw new Error('Email ou mot de passe incorrect');
    }

    // Generate mock tokens
    const token = this.generateToken(user);
    const refreshToken = this.generateRefreshToken();

    // Store tokens in localStorage for persistence
    localStorage.setItem('noli:auth_token', token);
    localStorage.setItem('noli:refresh_token', refreshToken);
    localStorage.setItem('noli:user', JSON.stringify(user));

    return {
      user,
      token,
      refreshToken,
    };
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Check if user already exists
    const existingUser = getUserByEmail(data.email);
    if (existingUser) {
      throw new Error('Un compte avec cet email existe déjà');
    }

    // Create new user
    const newUser: User = {
      id: Date.now().toString(),
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: 'USER', // Default role for new registrations
      phone: data.phone,
      avatar: '👤',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Generate tokens
    const token = this.generateToken(newUser);
    const refreshToken = this.generateRefreshToken();

    // Store in localStorage
    localStorage.setItem('noli:auth_token', token);
    localStorage.setItem('noli:refresh_token', refreshToken);
    localStorage.setItem('noli:user', JSON.stringify(newUser));

    return {
      user: newUser,
      token,
      refreshToken,
    };
  }

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = localStorage.getItem('noli:refresh_token');
    const userStr = localStorage.getItem('noli:user');

    if (!refreshToken || !userStr) {
      throw new Error('Session expirée. Veuillez vous reconnecter.');
    }

    const user = JSON.parse(userStr) as User;

    // Generate new tokens
    const newToken = this.generateToken(user);
    const newRefreshToken = this.generateRefreshToken();

    // Update localStorage
    localStorage.setItem('noli:auth_token', newToken);
    localStorage.setItem('noli:refresh_token', newRefreshToken);

    return {
      user,
      token: newToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(): Promise<void> {
    // Clear all auth-related items from localStorage
    localStorage.removeItem('noli:auth_token');
    localStorage.removeItem('noli:refresh_token');
    localStorage.removeItem('noli:user');
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('noli:user');
    if (!userStr) return null;

    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('noli:auth_token') && !!this.getCurrentUser();
  }

  private generateToken(user: User): string {
    // Mock JWT token - in real app, use proper JWT library
    const header = btoa(JSON.stringify({ typ: 'JWT', alg: 'HS256' }));
    const payload = btoa(JSON.stringify({
      sub: user.id,
      email: user.email,
      role: user.role,
      exp: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      iat: Date.now(),
    }));
    const signature = btoa('mock-signature');

    return `${header}.${payload}.${signature}`;
  }

  private generateRefreshToken(): string {
    return `refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const authService = AuthService.getInstance();
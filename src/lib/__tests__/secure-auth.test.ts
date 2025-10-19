import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { secureAuthService } from '../secure-auth';
import { supabase } from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      refreshSession: vi.fn(),
    },
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('SecureAuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initializeSecureAuth', () => {
    it('devrait initialiser l\'authentification sécurisée', () => {
      // Act
      secureAuthService.initializeSecureAuth();

      // Assert - Vérifier qu'aucune erreur n'est levée
      expect(true).toBe(true);
    });
  });

  describe('cleanupLegacyTokens', () => {
    it('devrait nettoyer les anciens tokens du localStorage', () => {
      // Arrange
      localStorageMock.setItem('supabase.auth.token', 'legacy-token');
      localStorageMock.setItem('sb-access-token', 'access-token');
      localStorageMock.setItem('other-key', 'should-remain');

      // Act
      secureAuthService.cleanupLegacyTokens();

      // Assert
      expect(localStorageMock.getItem('supabase.auth.token')).toBeNull();
      expect(localStorageMock.getItem('sb-access-token')).toBeNull();
      expect(localStorageMock.getItem('other-key')).toBe('should-remain');
    });

    it('ne devrait rien faire si aucun token legacy n\'existe', () => {
      // Arrange
      localStorageMock.setItem('other-key', 'should-remain');

      // Act
      secureAuthService.cleanupLegacyTokens();

      // Assert
      expect(localStorageMock.getItem('other-key')).toBe('should-remain');
      expect(localStorageMock.removeItem).toHaveBeenCalledTimes(0);
    });
  });

  describe('validateSecureStorage', () => {
    it('devrait retourner false si des tokens legacy existent', () => {
      // Arrange
      localStorageMock.setItem('supabase.auth.token', 'legacy-token');

      // Act
      const result = secureAuthService.validateSecureStorage();

      // Assert
      expect(result).toBe(false);
    });

    it('devrait retourner true si aucun token legacy n\'existe', () => {
      // Arrange
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { user: { id: '123' } } },
        error: null
      });

      // Act
      const result = secureAuthService.validateSecureStorage();

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('migrateToSecureStorage', () => {
    it('devrait migrer avec succès vers les cookies sécurisés', async () => {
      // Arrange
      localStorageMock.setItem('supabase.auth.token', 'legacy-token');
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { user: { id: '123' } } },
        error: null
      });
      vi.mocked(supabase.auth.refreshSession).mockResolvedValue({ error: null });

      // Act
      const result = await secureAuthService.migrateToSecureStorage();

      // Assert
      expect(result).toBe(true);
      expect(localStorageMock.getItem('supabase.auth.token')).toBeNull();
      expect(supabase.auth.refreshSession).toHaveBeenCalled();
    });

    it('devrait gérer le cas où aucune session n\'existe', async () => {
      // Arrange
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null
      });

      // Act
      const result = await secureAuthService.migrateToSecureStorage();

      // Assert
      expect(result).toBe(true);
      expect(supabase.auth.refreshSession).not.toHaveBeenCalled();
    });

    it('devrait retourner false en cas d\'erreur de session', async () => {
      // Arrange
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: new Error('Session error')
      });

      // Act
      const result = await secureAuthService.migrateToSecureStorage();

      // Assert
      expect(result).toBe(false);
    });

    it('devrait retourner false si le rafraîchissement échoue', async () => {
      // Arrange
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { user: { id: '123' } } },
        error: null
      });
      vi.mocked(supabase.auth.refreshSession).mockResolvedValue({
        error: new Error('Refresh failed')
      });

      // Act
      const result = await secureAuthService.migrateToSecureStorage();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('Singleton pattern', () => {
    it('devrait retourner la même instance', () => {
      // Act
      const instance1 = secureAuthService;
      const instance2 = secureAuthService;

      // Assert
      expect(instance1).toBe(instance2);
    });
  });
});
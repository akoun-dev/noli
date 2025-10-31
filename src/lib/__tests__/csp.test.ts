import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cspManager } from '../csp';

// Mock DOM methods
const mockCreateElement = vi.fn();
const mockSetAttribute = vi.fn();
const mockAppendChild = vi.fn();
const mockQuerySelector = vi.fn();
const mockGetAttribute = vi.fn();

// Mock document object
Object.defineProperty(global, 'document', {
  value: {
    createElement: mockCreateElement,
    head: {
      appendChild: mockAppendChild,
    },
    querySelector: mockQuerySelector,
  },
  writable: true,
});

// Mock import.meta.env
vi.stubEnv('NODE_ENV', 'test');

describe('CSPManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuerySelector.mockReturnValue(null);
    mockCreateElement.mockReturnValue({
      setAttribute: mockSetAttribute,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getProductionCSP', () => {
    it('devrait générer un CSP strict pour la production', () => {
      // Act
      const csp = cspManager.getProductionCSP();

      // Assert
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("frame-src 'none'");
      expect(csp).toContain('https://api.supabase.co');
      expect(csp).toContain('https://cdn.supabase.co');
    });

    it('devrait inclure les domaines Supabase dans script-src', () => {
      // Act
      const csp = cspManager.getProductionCSP();

      // Assert
      expect(csp).toContain('script-src');
      expect(csp).toContain('https://cdn.supabase.co');
    });

    it('devrait inclure les domaines autorisés dans connect-src', () => {
      // Act
      const csp = cspManager.getProductionCSP();

      // Assert
      expect(csp).toContain('connect-src');
      expect(csp).toContain('https://api.supabase.co');
      expect(csp).toContain('wss://api.supabase.co');
    });
  });

  describe('getDevelopmentCSP', () => {
    it('devrait générer un CSP plus permissif pour le développement', () => {
      // Act
      const csp = cspManager.getDevelopmentCSP();

      // Assert
      expect(csp).toContain("'unsafe-eval'");
      expect(csp).toContain("'unsafe-inline'");
      expect(csp).toContain('ws:');
      expect(csp).toContain('wss:');
    });
  });

  describe('injectCSP', () => {
    it('devrait injecter le CSP dans le head', () => {
      // Act
      cspManager.injectCSP();

      // Assert
      expect(mockQuerySelector).toHaveBeenCalledWith(
        'meta[http-equiv="Content-Security-Policy"]'
      );
      expect(mockCreateElement).toHaveBeenCalledWith('meta');
      expect(mockSetAttribute).toHaveBeenCalledWith('http-equiv', 'Content-Security-Policy');
      expect(mockSetAttribute).toHaveBeenCalledWith(
        'content',
        expect.stringContaining('default-src')
      );
      expect(mockAppendChild).toHaveBeenCalled();
    });

    it('ne devrait pas injecter de CSP si un existe déjà', () => {
      // Arrange
      mockQuerySelector.mockReturnValue({
        getAttribute: mockGetAttribute,
      });

      // Act
      cspManager.injectCSP();

      // Assert
      expect(mockCreateElement).not.toHaveBeenCalled();
      expect(mockAppendChild).not.toHaveBeenCalled();
    });
  });

  describe('validateCSP', () => {
    it('devrait valider un CSP correct', () => {
      // Arrange
      mockQuerySelector.mockReturnValue({
        getAttribute: mockGetAttribute.mockReturnValue(
          "default-src 'self'; script-src 'self'; object-src 'none'; frame-src 'none'"
        ),
      });

      // Act
      const result = cspManager.validateCSP();

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('devrait détecter l\'absence de CSP', () => {
      // Arrange
      mockQuerySelector.mockReturnValue(null);

      // Act
      const result = cspManager.validateCSP();

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Aucun CSP détecté');
    });

    it('devrait détecter les problèmes de sécurité', () => {
      // Arrange
      mockQuerySelector.mockReturnValue({
        getAttribute: mockGetAttribute.mockReturnValue(
          "script-src 'unsafe-inline'; object-src 'self'; frame-src 'self'"
        ),
      });

      // Act
      const result = cspManager.validateCSP();

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain("object-src n'est pas défini à 'none'");
      expect(result.issues).toContain("frame-src n'est pas défini à 'none'");
    });
  });

  describe('inspectCurrentCSP', () => {
    it('devrait retourner null si aucun CSP n\'existe', () => {
      // Arrange
      mockQuerySelector.mockReturnValue(null);

      // Act
      const result = cspManager.inspectCurrentCSP();

      // Assert
      expect(result).toBeNull();
    });

    it('devrait parser le CSP existant', () => {
      // Arrange
      const mockCSP = "default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self'";
      mockQuerySelector.mockReturnValue({
        getAttribute: mockGetAttribute.mockReturnValue(mockCSP),
      });

      // Act
      const result = cspManager.inspectCurrentCSP();

      // Assert
      expect(result).toEqual({
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'"],
        'connect-src': ["'self'"],
      });
    });
  });

  describe('Singleton pattern', () => {
    it('devrait retourner la même instance', () => {
      // Act
      const instance1 = cspManager;
      const instance2 = cspManager;

      // Assert
      expect(instance1).toBe(instance2);
    });
  });
});
import { describe, it, expect } from 'vitest';
import type { UserMetadata, AuditMetadata, JsonValue } from '../common';

describe('Common Types', () => {
  describe('UserMetadata', () => {
    it('should accept valid user metadata', () => {
      const metadata: UserMetadata = {
        first_name: 'John',
        last_name: 'Doe',
        company: 'Test Corp',
        role: 'USER',
        avatar_url: 'https://example.com/avatar.jpg'
      };

      expect(metadata.first_name).toBe('John');
      expect(metadata.role).toBe('USER');
    });

    it('should accept partial user metadata', () => {
      const metadata: UserMetadata = {
        first_name: 'Jane'
      };

      expect(metadata.first_name).toBe('Jane');
      expect(metadata.last_name).toBeUndefined();
    });
  });

  describe('AuditMetadata', () => {
    it('should accept valid audit metadata', () => {
      const audit: AuditMetadata = {
        action: 'login',
        resource: 'auth',
        timestamp: '2024-01-01T00:00:00Z',
        user_id: 'user-123',
        details: {
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0'
        }
      };

      expect(audit.action).toBe('login');
      expect(audit.user_id).toBe('user-123');
    });

    it('should accept minimal audit metadata', () => {
      const audit: AuditMetadata = {
        action: 'logout'
      };

      expect(audit.action).toBe('logout');
      expect(audit.resource).toBeUndefined();
    });
  });

  describe('JsonValue', () => {
    it('should accept primitive JSON values', () => {
      const primitives: JsonValue[] = [
        'string',
        42,
        true,
        false,
        null,
        undefined
      ];

      expect(primitives).toHaveLength(6);
    });

    it('should accept complex JSON objects', () => {
      const complexObject: JsonValue = {
        user: {
          name: 'John',
          age: 30,
          active: true
        },
        tags: ['admin', 'user'],
        meta: null
      };

      expect(typeof complexObject).toBe('object');
      expect(Array.isArray(complexObject)).toBe(false);
    });

    it('should accept JSON arrays', () => {
      const jsonArray: JsonValue = [
        'string',
        42,
        { nested: true },
        [1, 2, 3]
      ];

      expect(Array.isArray(jsonArray)).toBe(true);
    });
  });
});
import { describe, it, expect } from 'vitest';
import { cn } from '../../lib/utils';

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const isInactive = false;
    expect(cn('base-class', isActive && 'active', isInactive && 'inactive')).toBe('base-class active');
  });

  it('should handle undefined and null values', () => {
    expect(cn('base-class', undefined, null, 'additional')).toBe('base-class additional');
  });

  it('should handle empty strings', () => {
    expect(cn('base-class', '', 'additional')).toBe('base-class additional');
  });

  it('should handle arrays of classes', () => {
    expect(cn(['px-2', 'py-1'], 'flex')).toBe('px-2 py-1 flex');
  });

  it('should handle objects with boolean values', () => {
    expect(cn({
      'px-2': true,
      'py-1': false,
      'flex': true
    })).toBe('px-2 flex');
  });

  it('should handle mixed inputs', () => {
    expect(cn(
      'base-class',
      { 'active': true, 'inactive': false },
      ['px-2', undefined],
      null
    )).toBe('base-class active px-2');
  });

  it('should handle Tailwind class conflicts', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('should return empty string for no input', () => {
    expect(cn()).toBe('');
  });

  it('should handle complex Tailwind utilities', () => {
    expect(cn('hover:bg-blue-500', 'focus:outline-none', 'disabled:opacity-50')).toBe('hover:bg-blue-500 focus:outline-none disabled:opacity-50');
  });
});
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from '../logger';

describe('Logger', () => {
  // Mock console methods
  const consoleDebug = vi.spyOn(console, 'debug').mockImplementation(() => {});
  const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => {});
  const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment to development mode
    vi.stubEnv('NODE_ENV', 'development');
  });

  it('should log debug messages in development', () => {
    logger.debug('Test debug message', { data: 'test' });

    expect(consoleDebug).toHaveBeenCalledWith('🔍 [DEBUG] Test debug message', { data: 'test' });
  });

  it('should log info messages in development', () => {
    logger.info('Test info message');

    expect(consoleInfo).toHaveBeenCalledWith('ℹ️ [INFO] Test info message');
  });

  it('should log warning messages', () => {
    logger.warn('Test warning message');

    expect(consoleWarn).toHaveBeenCalledWith('⚠️ [WARN] Test warning message');
  });

  it('should log error messages', () => {
    logger.error('Test error message', new Error('Test error'));

    expect(consoleError).toHaveBeenCalledWith('❌ [ERROR] Test error message', new Error('Test error'));
  });

  it('should log auth-specific messages', () => {
    logger.auth('User logged in', { userId: '123' });

    expect(consoleDebug).toHaveBeenCalledWith('🔐 [AUTH] User logged in', { userId: '123' });
  });

  it('should log API-specific messages', () => {
    logger.api('API call successful', { endpoint: '/test', status: 200 });

    expect(consoleDebug).toHaveBeenCalledWith('🌐 [API] API call successful', { endpoint: '/test', status: 200 });
  });

  it('should log performance-specific messages', () => {
    logger.perf('Component rendered in 50ms');

    expect(consoleDebug).toHaveBeenCalledWith('⚡ [PERF] Component rendered in 50ms');
  });
});
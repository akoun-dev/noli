import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Logger', () => {
  let consoleDebug: ReturnType<typeof vi.spyOn>;
  let consoleInfo: ReturnType<typeof vi.spyOn>;
  let consoleWarn: ReturnType<typeof vi.spyOn>;
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Mock console methods after each test setup
    consoleDebug = vi.spyOn(console, 'debug').mockImplementation(() => {});
    consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Reset environment to development mode
    vi.stubEnv('NODE_ENV', 'development');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('devrait créer une instance de logger', async () => {
    const { logger } = await import('../logger');
    expect(logger).toBeDefined();
  });

  it('devrait logger les messages de debug en développement', async () => {
    const { logger } = await import('../logger');

    logger.debug('Test debug message', { data: 'test' });

    expect(consoleDebug).toHaveBeenCalledWith('🔍 [DEBUG] Test debug message', { data: 'test' });
  });

  it('devrait logger les messages info en développement', async () => {
    const { logger } = await import('../logger');

    logger.info('Test info message');

    expect(consoleInfo).toHaveBeenCalledWith('ℹ️ [INFO] Test info message');
  });

  it('devrait logger les messages warning', async () => {
    const { logger } = await import('../logger');

    logger.warn('Test warning message');

    expect(consoleWarn).toHaveBeenCalledWith('⚠️ [WARN] Test warning message');
  });

  it('devrait logger les messages erreur', async () => {
    const { logger } = await import('../logger');

    logger.error('Test error message', new Error('Test error'));

    expect(consoleError).toHaveBeenCalledWith('❌ [ERROR] Test error message', new Error('Test error'));
  });

  it('devrait logger les messages d\'authentification', async () => {
    const { logger } = await import('../logger');

    logger.auth('User logged in', { userId: '123' });

    expect(consoleDebug).toHaveBeenCalledWith('🔐 [AUTH] User logged in', { userId: '123' });
  });

  it('devrait logger les messages API', async () => {
    const { logger } = await import('../logger');

    logger.api('API call successful', { endpoint: '/test', status: 200 });

    expect(consoleDebug).toHaveBeenCalledWith('🌐 [API] API call successful', { endpoint: '/test', status: 200 });
  });

  it('devrait logger les messages de performance', async () => {
    const { logger } = await import('../logger');

    logger.perf('Component rendered in 50ms');

    expect(consoleDebug).toHaveBeenCalledWith('⚡ [PERF] Component rendered in 50ms');
  });
});
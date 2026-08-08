import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Supabase
vi.mock('@/lib/supabase', () => {
  // A chainable PostgREST-style query builder.
  //
  // Every filter/modifier method (`select`, `eq`, `order`, …) returns the same
  // builder so arbitrarily long chains work. The builder is itself a thenable
  // that resolves to `{ data: [], error: null }`, so `await supabase.from(x)...`
  // works for list queries. The row-terminal methods (`single`, `maybeSingle`)
  // resolve to `{ data: null, error: null }`. Individual tests override these
  // return values as needed; this default just prevents "reading 'select' of
  // undefined" crashes and lets services fall through their empty-result paths.
  const createQueryBuilder = () => {
    const resolvedList = () => Promise.resolve({ data: [], error: null, count: 0 });
    const builder: Record<string, unknown> = {};

    const chainMethods = [
      'select', 'insert', 'update', 'upsert', 'delete',
      'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
      'like', 'ilike', 'is', 'in', 'contains', 'containedBy',
      'range', 'overlaps', 'match', 'not', 'or', 'and', 'filter',
      'order', 'limit', 'offset', 'textSearch', 'returns', 'abortSignal',
    ];
    for (const method of chainMethods) {
      builder[method] = vi.fn(() => builder);
    }

    // Row-terminal helpers resolve to a single (absent) row.
    builder.single = vi.fn(() => Promise.resolve({ data: null, error: null }));
    builder.maybeSingle = vi.fn(() => Promise.resolve({ data: null, error: null }));
    builder.csv = vi.fn(() => Promise.resolve({ data: '', error: null }));

    // Make the builder awaitable as a list query.
    builder.then = (onFulfilled: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) =>
      resolvedList().then(onFulfilled, onRejected);
    builder.catch = (onRejected: (reason: unknown) => unknown) => resolvedList().catch(onRejected);
    builder.finally = (onFinally: () => void) => resolvedList().finally(onFinally);

    return builder;
  };

  return {
    supabase: {
      auth: {
        getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
        getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
        refreshSession: vi.fn(() => Promise.resolve({ data: { session: null, user: null }, error: null })),
        setSession: vi.fn(() => Promise.resolve({ data: { session: null, user: null }, error: null })),
        signInWithPassword: vi.fn(() => Promise.resolve({ data: { user: null, session: null }, error: null })),
        signInWithOAuth: vi.fn(() => Promise.resolve({ data: { provider: 'google', url: '' }, error: null })),
        signUp: vi.fn(() => Promise.resolve({ data: { user: null, session: null }, error: null })),
        signOut: vi.fn(() => Promise.resolve({ error: null })),
        updateUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
        resetPasswordForEmail: vi.fn(() => Promise.resolve({ data: {}, error: null })),
        onAuthStateChange: vi.fn(() => ({
          data: { subscription: { unsubscribe: vi.fn() } }
        })),
      },
      from: vi.fn(() => createQueryBuilder()),
      rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
      channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
      })),
      removeChannel: vi.fn(),
      storage: {
        from: vi.fn(() => ({
          upload: vi.fn(() => Promise.resolve({ data: null, error: null })),
          download: vi.fn(() => Promise.resolve({ data: null, error: null })),
          remove: vi.fn(() => Promise.resolve({ data: null, error: null })),
          getPublicUrl: vi.fn(() => ({ data: { publicUrl: '' } })),
        })),
      },
    },
    supabaseHelpers: {
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      getProfile: vi.fn(),
      updateProfile: vi.fn(),
      getUserPermissions: vi.fn(),
      hasPermission: vi.fn(),
      logAction: vi.fn(),
    },
  };
});

// Mock environment variables
vi.mock('@/lib/env', () => ({
  VITE_SUPABASE_URL: 'http://localhost:54321',
  VITE_SUPABASE_ANON_KEY: 'mock-anon-key',
  VITE_APP_NAME: 'Noli Test',
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// jsdom does not implement the Notification Web API. Provide a minimal
// constructor with the static `permission` / `requestPermission` members so
// code that reads `Notification.permission` does not crash. Tests that care
// about notification behaviour override `window.Notification` themselves.
if (typeof (globalThis as { Notification?: unknown }).Notification === 'undefined') {
  class NotificationMock {
    static permission: NotificationPermission = 'default';
    static requestPermission = vi.fn(() => Promise.resolve('default' as NotificationPermission));
    onclick: (() => void) | null = null;
    close = vi.fn();
    constructor(
      public title: string,
      public options?: NotificationOptions
    ) {}
  }
  Object.defineProperty(window, 'Notification', {
    value: NotificationMock,
    writable: true,
    configurable: true,
  });
}
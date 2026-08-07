/**
 * Typed factory helpers for Supabase auth mocks.
 *
 * These builders return fully-typed `User`, `Session` and `AuthError` objects
 * so tests can mock Supabase auth calls without resorting to type suppressions.
 * Pass `overrides` to customise only the fields a given test cares about.
 */
import type { User, Session } from '@supabase/supabase-js'
import { AuthError } from '@supabase/supabase-js'

/** Build a complete Supabase `User`, filling all required fields with defaults. */
export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'test-user-id',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

/** Build a complete Supabase `Session`, filling all required fields with defaults. */
export function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    user: makeUser(),
    ...overrides,
  }
}

/** Build a real Supabase `AuthError` (carries `code`, `status`, `__isAuthError`). */
export function makeAuthError(
  overrides: Partial<Pick<AuthError, 'message' | 'status' | 'code' | 'name'>> = {}
): AuthError {
  const error = new AuthError(
    overrides.message ?? 'Auth error',
    overrides.status ?? 400,
    overrides.code ?? 'auth_error'
  )
  error.name = overrides.name ?? 'AuthError'
  return error
}

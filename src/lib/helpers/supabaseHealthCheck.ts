import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export interface HealthCheckResult {
  success: boolean
  message: string
  latency?: number
}

/**
 * Test the connection to Supabase database
 * @returns HealthCheckResult with success status and message
 */
export async function testDatabaseConnection(): Promise<HealthCheckResult> {
  try {
    const startTime = performance.now()

    // Simple query to test connection - get the first user (or return empty)
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    const latency = performance.now() - startTime

    if (error) {
      logger.error('Database health check failed', error)
      return {
        success: false,
        message: `Database connection failed: ${error.message}`,
        latency,
      }
    }

    logger.debug('Database health check successful', { latency })
    return {
      success: true,
      message: 'Database connection successful',
      latency,
    }
  } catch (error) {
    logger.error('Database health check exception', error instanceof Error ? error : undefined)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error during health check',
    }
  }
}

/**
 * Check if Supabase auth is accessible
 * @returns HealthCheckResult with auth service status
 */
export async function testAuthService(): Promise<HealthCheckResult> {
  try {
    const startTime = performance.now()

    // Simply check if we can get the current session (doesn't require auth)
    const { error } = await supabase.auth.getSession()

    const latency = performance.now() - startTime

    if (error) {
      logger.error('Auth service health check failed', error)
      return {
        success: false,
        message: `Auth service failed: ${error.message}`,
        latency,
      }
    }

    logger.debug('Auth service health check successful', { latency })
    return {
      success: true,
      message: 'Auth service accessible',
      latency,
    }
  } catch (error) {
    logger.error('Auth service health check exception', error instanceof Error ? error : undefined)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error during auth health check',
    }
  }
}

/**
 * Run all health checks
 * @returns Object with results from all checks
 */
export async function runHealthChecks() {
  const [dbResult, authResult] = await Promise.all([
    testDatabaseConnection(),
    testAuthService(),
  ])

  return {
    database: dbResult,
    auth: authResult,
    overall: dbResult.success && authResult.success,
  }
}

/**
 * Configuration Sentry pour le tracking d'erreurs et de performance
 */

import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import { Replay } from '@sentry/replay';
import { logger } from '@/lib/logger';

// Configuration de l'environnement
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Configuration Sentry
export const initSentry = (): void => {
  // Ne pas initialiser Sentry si le DSN n'est pas configuré
  if (!import.meta.env.VITE_SENTRY_DSN) {
    logger.warn('Sentry DSN not configured, skipping initialization');
    return;
  }

  try {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,

      // Performance monitoring
      integrations: [
        new BrowserTracing({
          // Options de tracing
          tracePropagationTargets: [
            'localhost',
            /^https:\/\/yourdomain\.io/,
            import.meta.env.VITE_SUPABASE_URL,
          ],
        }),
        new Replay({
          // Session replay
          maskAllText: false,
          blockAllMedia: false,
          maskAllInputs: true,
        }),
      ],

      // Options de tracing
      tracesSampleRate: isProduction ? 0.1 : 1.0, // 10% en production, 100% en dev
      tracePropagationTargets: [
        'localhost',
        /^\//,
        import.meta.env.VITE_SUPABASE_URL,
      ],

      // Session replay
      replaysSessionSampleRate: isProduction ? 0.1 : 1.0,
      replaysOnErrorSampleRate: 1.0,

      // Configuration du beforeSend
      beforeSend(event, hint) {
        // Filtrer les erreurs non critiques en développement
        if (isDevelopment) {
          // Garder toutes les erreurs en développement
          logger.error('Sentry error captured', hint.originalException, {
            sentryEventId: event.event_id,
            sentryLevel: event.level,
          });
        } else {
          // Loguer les erreurs en production
          logger.error('Sentry error captured', hint.originalException, {
            sentryEventId: event.event_id,
            sentryLevel: event.level,
          });
        }

        // Filtrer certaines erreurs
        if (event.exception) {
          const error = hint.originalException as Error;

          // Ignorer les erreurs de réseau communes
          if (error?.message?.includes('Network Error') ||
              error?.message?.includes('Fetch Error') ||
              error?.message?.includes('AbortError')) {
            return null;
          }

          // Ignorer les erreurs de permissions non critiques
          if (event.message?.includes('Permission denied') &&
              event.level === 'warning') {
            return null;
          }
        }

        return event;
      },

      // Configuration des tags
      tags: {
        service: 'noli-frontend',
        version: import.meta.env.VITE_APP_VERSION || '1.0.0',
        environment: import.meta.env.MODE,
      },

      // Configuration du contexte
      initialScope: {
        tags: {
          framework: 'react',
          bundler: 'vite',
        },
        user: {
          // Sera mis à jour dynamiquement
        },
      },

      // Configuration de la release
      release: import.meta.env.VITE_APP_VERSION || '1.0.0',

      // Configuration du dist
      dist: import.meta.env.VITE_BUILD_NUMBER || '1',

      // Options de débogage
      debug: isDevelopment,

      // Désactiver l'auto tracking de certains événements
      autoSessionTracking: true,
      sendDefaultPii: false,
      sendClientReports: true,
    });

    logger.info('Sentry initialized successfully', {
      environment: import.meta.env.MODE,
      dsnConfigured: !!import.meta.env.VITE_SENTRY_DSN,
      tracesSampleRate: isProduction ? 0.1 : 1.0,
      replaysSessionSampleRate: isProduction ? 0.1 : 1.0,
    });

  } catch (error) {
    logger.error('Failed to initialize Sentry', error as Error);
  }
};

// Fonctions utilitaires pour Sentry
export const setSentryUser = (user: {
  id: string;
  email?: string;
  name?: string;
  role?: string;
}): void => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
    extra: {
      role: user.role,
    },
  });

  logger.debug('Sentry user set', { userId: user.id, role: user.role });
};

export const clearSentryUser = (): void => {
  Sentry.setUser(null);
  logger.debug('Sentry user cleared');
};

export const setSentryTag = (key: string, value: string): void => {
  Sentry.setTag(key, value);
  logger.debug('Sentry tag set', { key, value });
};

export const addSentryBreadcrumb = (
  category: string,
  message: string,
  level: 'debug' | 'info' | 'warn' | 'error' = 'info',
  data?: Record<string, any>
): void => {
  Sentry.addBreadcrumb({
    category,
    message,
    level,
    data,
    timestamp: new Date().toISOString(),
  });

  logger.debug('Sentry breadcrumb added', { category, message, level });
};

export const captureSentryMessage = (
  message: string,
  level: 'debug' | 'info' | 'warn' | 'error' = 'info',
  context?: Record<string, any>
): void => {
  Sentry.captureMessage(message, level, {
    extra: context,
  });

  logger.debug('Sentry message captured', { message, level });
};

export const captureSentryException = (
  error: Error,
  context?: Record<string, any>
): string | undefined => {
  const eventId = Sentry.captureException(error, {
    extra: context,
  });

  logger.error('Sentry exception captured', error, {
    eventId,
    context,
  });

  return eventId;
};

// Configuration du monitoring de performance
export const startTransaction = (name: string, op: string): Sentry.Transaction | undefined => {
  const transaction = Sentry.startTransaction({
    name,
    op,
  });

  logger.debug('Sentry transaction started', { name, op });
  return transaction;
};

export const finishTransaction = (transaction: Sentry.Transaction): void => {
  transaction.finish();
  logger.debug('Sentry transaction finished', {
    name: transaction.name,
    op: transaction.op,
    duration: transaction.endTimestamp - transaction.startTimestamp,
  });
};

// Hooks React pour le monitoring
export const useSentryRouting = (): void => {
  // Cette fonction sera utilisée dans les composants de routing
  // pour tracker les changements de page
};

export const useSentryPerformance = (): void => {
  // Cette fonction sera utilisée pour le monitoring
  // des performances des composants
};

// Configuration des filtres d'erreurs
export const ignoreSentryErrors = [
  // Erreurs de réseau communes
  /Network Error/i,
  /Fetch Error/i,
  /AbortError/i,
  /Failed to fetch/i,

  // Erreurs de permissions non critiques
  /Permission denied/i,
  /Access denied/i,

  // Erreurs de timeouts
  /timeout/i,
  /TimeoutError/i,

  // Erreurs de parsing JSON
  /Unexpected token/i,
  /JSON.parse/i,

  // Erreurs liées aux extensions de navigateur
  /Non-Error promise rejection/i,
  /ResizeObserver loop limit exceeded/i,
];

export const shouldIgnoreError = (error: Error): boolean => {
  return ignoreSentryErrors.some(pattern =>
    pattern.test(error.message) ||
    pattern.test(error.name)
  );
};

// Export des fonctions principales
export { Sentry };
export type { SentryOptions } from '@sentry/react/types/options';
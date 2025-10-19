import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/lib/logger';
import { analytics } from '@/lib/analytics';
import { captureSentryException } from '@/lib/sentry';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showError?: boolean;
  resetOnPropsChange?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      retryCount: 1,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Logging structuré
    logger.errorBoundary(error, errorInfo, {
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount,
    });

    // Tracking analytics
    analytics.trackError(error, {
      errorInfo,
      retryCount: this.state.retryCount,
      page: window.location.pathname,
    });

    // Capture Sentry
    captureSentryException(error, {
      errorInfo,
      retryCount: this.state.retryCount,
      componentStack: errorInfo.componentStack,
    });

    // Callback personnalisé
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Tentative de retry automatique
    if (this.state.retryCount < this.maxRetries) {
      this.scheduleRetry();
    }
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    // Réinitialiser l'état d'erreur si les props changent
    if (
      this.props.resetOnPropsChange &&
      this.state.hasError &&
      prevProps.children !== this.props.children
    ) {
      this.resetError();
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  private scheduleRetry = () => {
    const delay = Math.pow(2, this.state.retryCount) * 1000; // Backoff exponentiel

    this.retryTimeout = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }));
    }, delay);

    logger.info(`Scheduling automatic retry in ${delay}ms (attempt ${this.state.retryCount + 1})`);
  };

  private resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });

    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  };

  private handleRetry = () => {
    this.resetError();
  };

  private handleReportIssue = () => {
    const { error, errorInfo } = this.state;
    if (!error) return;

    // Préparer le rapport d'erreur
    const errorReport = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo,
      context: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        retryCount: this.state.retryCount,
      },
    };

    // Envoyer le rapport à Sentry ou un service de support
    const issueTitle = `Erreur: ${error.name}`;
    const issueBody = `
Erreur détectée dans l'application Noli Assurance

**Détails de l'erreur:**
- Nom: ${error.name}
- Message: ${error.message}
- Stack: ${error.stack}

**Contexte:**
- URL: ${window.location.href}
- User Agent: ${navigator.userAgent}
- Timestamp: ${new Date().toISOString()}
- Tentatives de retry: ${this.state.retryCount}

**Informations du composant:**
${JSON.stringify(errorInfo, null, 2)}
    `;

    // Copier dans le presse-papiers
    navigator.clipboard.writeText(issueBody).then(() => {
      logger.info('Error report copied to clipboard');
      alert('Le rapport d\'erreur a été copié dans votre presse-papiers');
    }).catch(() => {
      logger.error('Failed to copy error report to clipboard');
    });

    // Ouvrir l'outil de feedback (si disponible)
    if (window.Sentry) {
      window.Sentry.showReportDialog({
        eventId: window.Sentry.lastEventId(),
        title: issueTitle,
        subtitle: 'Veuillez décrire ce que vous faisiez lorsque l\'erreur s\'est produite',
      });
    }
  };

  private handleRefresh = () => {
    window.location.reload();
  };

  private getErrorSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    // Classifier la sévérité de l'erreur
    if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
      return 'medium'; // Erreur de chunk loading
    }
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      return 'low'; // Erreur réseau
    }
    if (error.message.includes('Permission') || error.message.includes('Unauthorized')) {
      return 'medium'; // Erreur de permission
    }
    return 'high'; // Erreur inconnue ou critique
  }

  render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state;
      const { fallback, showError = true } = this.props;

      // Si un fallback personnalisé est fourni, l'utiliser
      if (fallback) {
        return fallback;
      }

      const severity = error ? this.getErrorSeverity(error) : 'high';
      const canRetry = this.state.retryCount < this.maxRetries;

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                severity === 'critical' ? 'bg-red-100' :
                severity === 'high' ? 'bg-orange-100' :
                severity === 'medium' ? 'bg-yellow-100' :
                'bg-blue-100'
              }`}>
                <svg
                  className={`w-6 h-6 ${
                    severity === 'critical' ? 'text-red-600' :
                    severity === 'high' ? 'text-orange-600' :
                    severity === 'medium' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13 7.732V7a2 2 0 012-2h2a2 2 0 012 2v4.293c0 .412-.207.796-.548 1.02M19 7v10a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012-2V6.293c0-.412-.207-.796-.548-1.02"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h2 className="text-lg font-medium text-gray-900">
                  Oups! Une erreur est survenue
                </h2>
                <p className="text-sm text-gray-500">
                  Une erreur inattendue a empêché l'application de fonctionner correctement.
                </p>
              </div>
            </div>

            {showError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="text-sm text-red-800">
                  <strong>Erreur:</strong> {error?.message || 'Erreur inconnue'}
                  {error?.name && (
                    <span className="ml-2 text-xs bg-red-100 px-2 py-1 rounded">
                      {error.name}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                <p>
                  {severity === 'low' && 'Ceci est probablement une erreur temporaire.'}
                  {severity === 'medium' && 'L\'application peut avoir besoin d\'être rafraîchie.'}
                  {severity === 'high' && 'Une erreur critique a été détectée.'}
                  {severity === 'critical' && 'L\'application est dans un état instable.'}
                </p>

                {canRetry && (
                  <p>
                    Tentative de récupération automatique dans quelques secondes...
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                {canRetry && (
                  <button
                    onClick={this.handleRetry}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Réessayer
                  </button>
                )}

                <button
                  onClick={this.handleReportIssue}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Signaler le problème
                </button>

                <button
                  onClick={this.handleRefresh}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  Actualiser la page
                </button>
              </div>

              <div className="text-xs text-gray-500 text-center">
                <p>
                  Erreur ID: {window.Sentry?.lastEventId() || 'N/A'}
                </p>
                <p>
                  Tentative: {this.state.retryCount}/{this.maxRetries}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook pour les erreurs asynchrones
export const useErrorHandler = () => {
  const handleError = React.useCallback((error: Error, context?: Record<string, any>) => {
    logger.error('Async error caught', error, context);
    analytics.trackError(error, {
      ...context,
      type: 'async',
    });
    captureSentryException(error, context);
  }, []);

  const wrapAsync = React.useCallback(<T extends (...args: any[]) => Promise<any>>(
    fn: T
  ): T => {
    return (async (...args: Parameters<T>) => {
      try {
        return await fn(...args);
      } catch (error) {
        handleError(error as Error, {
          functionName: fn.name,
          args: args.map(arg => typeof arg === 'object' ? '[Object]' : String(arg)),
        });
        throw error;
      }
    });
  }, [handleError]);

  return { handleError, wrapAsync };
};

// Composant pour afficher un bouton de signalement d'erreur
export const ErrorReportButton: React.FC<{
  error?: Error;
  errorInfo?: ErrorInfo;
  className?: string;
}> = ({ error, errorInfo, className = '' }) => {
  const handleReport = () => {
    const reportData = {
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : null,
      errorInfo,
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      },
    };

    const reportText = JSON.stringify(reportData, null, 2);

    navigator.clipboard.writeText(reportText).then(() => {
      logger.info('Error report copied to clipboard');
    }).catch(() => {
      logger.error('Failed to copy error report');
    });

    if (window.Sentry) {
      window.Sentry.showReportDialog();
    }
  };

  return (
    <button
      onClick={handleReport}
      className={`inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 ${className}`}
    >
      <svg
        className="w-4 h-4 mr-1"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707L19.586 16H17a2 2 0 002-2v-2a2 2 0 00-2-2H7a2 2 0 00-2 2v2a2 2 0 002 2h9.586a1 1 0 001.707-.293l-5.414-5.414a1 1 0 00-.707-.293H7z"
        />
      </svg>
      Signaler
    </button>
  );
};

export default ErrorBoundary;
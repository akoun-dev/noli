import React, { useState } from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle, RefreshCw, ExternalLink, Mail, Phone } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface ErrorMessageProps {
  variant?: 'error' | 'warning' | 'info' | 'success';
  title: string;
  description?: string;
  actions?: {
    primary?: {
      label: string;
      onClick: () => void;
      variant?: 'default' | 'destructive' | 'outline';
    };
    secondary?: {
      label: string;
      onClick: () => void;
    };
  };
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

interface ErrorSuggestion {
  text: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  link?: {
    text: string;
    href: string;
  };
}

const errorMessages = {
  network: {
    title: 'Erreur de connexion',
    description: 'Impossible de communiquer avec le serveur. Vérifiez votre connexion internet.',
    suggestions: [
      {
        text: 'Vérifiez votre connexion Wi-Fi ou mobile',
        action: { label: 'Actualiser', onClick: () => window.location.reload() }
      },
      {
        text: 'Essayez de nouveau dans quelques instants',
        action: { label: 'Réessayer', onClick: () => {} }
      }
    ]
  },
  authentication: {
    title: 'Erreur d\'authentification',
    description: 'Votre session a expiré ou vos identifiants sont incorrects.',
    suggestions: [
      {
        text: 'Vérifiez votre email et mot de passe',
        action: { label: 'Se reconnecter', onClick: () => {} }
      },
      {
        text: 'Contactez le support si le problème persiste',
        link: { text: 'Contacter le support', href: '/contact' }
      }
    ]
  },
  validation: {
    title: 'Informations invalides',
    description: 'Certaines informations saisies ne sont pas valides.',
    suggestions: [
      {
        text: 'Vérifiez les champs marqués en rouge',
        action: { label: 'Corriger les erreurs', onClick: () => {} }
      }
    ]
  },
  permission: {
    title: 'Accès non autorisé',
    description: 'Vous n\'avez pas les permissions nécessaires pour effectuer cette action.',
    suggestions: [
      {
        text: 'Contactez votre administrateur pour obtenir les droits nécessaires',
        link: { text: 'Demander l\'accès', href: 'mailto:admin@noliassurance.com' }
      },
      {
        text: 'Retournez à la page précédente',
        action: { label: 'Retour', onClick: () => window.history.back() }
      }
    ]
  },
  notFound: {
    title: 'Page introuvable',
    description: 'La page que vous recherchez n\'existe pas ou a été déplacée.',
    suggestions: [
      {
        text: 'Retournez à la page d\'accueil',
        action: { label: 'Accueil', onClick: () => window.location.href = '/' }
      },
      {
        text: 'Utilisez le menu pour naviguer',
        link: { text: 'Menu principal', href: '/tableau-de-bord' }
      }
    ]
  },
  serverError: {
    title: 'Erreur serveur',
    description: 'Une erreur technique est survenue. Nos équipes sont informées.',
    suggestions: [
      {
        text: 'Réessayez dans quelques minutes',
        action: { label: 'Réessayer', onClick: () => window.location.reload() }
      },
      {
        text: 'Contactez le support si le problème persiste',
        link: { text: 'support@noliassurance.com', href: 'mailto:support@noliassurance.com' }
      }
    ]
  },
  fileSize: {
    title: 'Fichier trop volumineux',
    description: 'Le fichier dépasse la taille autorisée (10MB maximum).',
    suggestions: [
      {
        text: 'Compressez le fichier ou choisissez un fichier plus petit',
        action: { label: 'Choisir un autre fichier', onClick: () => {} }
      },
      {
        text: 'Utilisez un service de compression en ligne',
        link: { text: 'Outils de compression', href: 'https://compressjpeg.com/' }
      }
    ]
  },
  invalidFormat: {
    title: 'Format de fichier non supporté',
    description: 'Le format de ce fichier n\'est pas accepté.',
    suggestions: [
      {
        text: 'Utilisez un format accepté (PDF, JPG, PNG, DOC, DOCX)',
        action: { label: 'Choisir un autre fichier', onClick: () => {} }
      }
    ]
  }
};

const variantStyles = {
  error: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200',
  warning: 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200',
  info: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200',
  success: 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200'
};

const iconMap = {
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle
};

export function ErrorMessage({
  variant = 'error',
  title,
  description,
  actions,
  dismissible = false,
  onDismiss,
  className
}: ErrorMessageProps) {
  const Icon = iconMap[variant];

  return (
    <div className={cn(
      'rounded-lg border p-4',
      variantStyles[variant],
      className
    )}>
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">{title}</h3>

          {description && (
            <p className="text-sm mt-1 opacity-90">{description}</p>
          )}

          {actions && (
            <div className="flex flex-wrap gap-2 mt-3">
              {actions.primary && (
                <Button
                  size="sm"
                  variant={actions.primary.variant || 'default'}
                  onClick={actions.primary.onClick}
                >
                  {actions.primary.label}
                </Button>
              )}

              {actions.secondary && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={actions.secondary.onClick}
                >
                  {actions.secondary.label}
                </Button>
              )}
            </div>
          )}
        </div>

        {dismissible && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

interface ErrorSuggestionProps {
  type: keyof typeof errorMessages;
  customActions?: ErrorSuggestion[];
  className?: string;
}

export function ErrorSuggestions({
  type,
  customActions,
  className
}: ErrorSuggestionProps) {
  const message = errorMessages[type];
  const suggestions = customActions || message.suggestions;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="bg-muted/50 rounded-lg p-4">
        <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {message.title}
        </h3>

        {message.description && (
          <p className="text-sm text-muted-foreground mb-3">
            {message.description}
          </p>
        )}

        <div className="space-y-2">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm">{suggestion.text}</p>

                {suggestion.action && (
                  <Button
                    size="sm"
                    variant="link"
                    onClick={suggestion.action.onClick}
                    className="h-auto p-0 text-sm font-normal"
                  >
                    {suggestion.action.label}
                  </Button>
                )}

                {suggestion.link && (
                  <a
                    href={suggestion.link.href}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    {suggestion.link.text}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact support section */}
      <div className="flex flex-col sm:flex-row gap-3 text-sm">
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          support@noliassurance.com
        </Button>

        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Phone className="h-4 w-4" />
          +225 27 22 44 44 44
        </Button>

        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Réessayer
        </Button>
      </div>
    </div>
  );
}

// Hook pour gérer les messages d'erreur
export function useErrorMessages() {
  const [errors, setErrors] = useState<Array<{
    id: string;
    type: keyof typeof errorMessages;
    timestamp: number;
  }>>([]);

  const addError = (type: keyof typeof errorMessages) => {
    const id = Math.random().toString(36).substr(2, 9);
    setErrors(prev => [...prev, { id, type, timestamp: Date.now() }]);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      removeError(id);
    }, 10000);
  };

  const removeError = (id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  };

  const clearErrors = () => {
    setErrors([]);
  };

  return {
    errors,
    addError,
    removeError,
    clearErrors
  };
}
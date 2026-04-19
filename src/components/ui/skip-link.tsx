import React from 'react';
import { cn } from '@/lib/utils';

interface SkipLinkProps {
  className?: string;
  children: React.ReactNode;
}

export const SkipLink: React.FC<SkipLinkProps> = ({ className, children }) => {
  return (
    <a
      href="#main-content"
      className={cn(
        // Positionné hors écran mais visible au focus
        'absolute top-0 left-0 -translate-y-full focus:translate-y-0',
        'z-50 bg-primary text-primary-foreground px-4 py-2 rounded-sm',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'text-sm font-medium',
        // S'assurer qu'il est visible au focus
        'focus:visible',
        className
      )}
    >
      {children}
    </a>
  );
};

// Ensemble de liens de navigation rapides pour l'accessibilité
export const SkipLinks: React.FC = () => {
  return (
    <div className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 z-50">
      <SkipLink>Aller au contenu principal</SkipLink>
      <SkipLink className="ml-2">Aller à la navigation</SkipLink>
      <SkipLink className="ml-2">Aller au pied de page</SkipLink>
    </div>
  );
};
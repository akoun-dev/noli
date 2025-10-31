import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

interface LazyLoadingWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const LazyLoadingWrapper: React.FC<LazyLoadingWrapperProps> = ({
  children,
  fallback
}) => {
  const defaultFallback = (
    <div className="flex items-center justify-center p-8">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
};
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface GlobalLoadingContextType {
  isLoading: boolean;
  setLoading: (loading: boolean, source?: string) => void;
  loadingSources: Set<string>;
}

const GlobalLoadingContext = createContext<GlobalLoadingContextType | undefined>(undefined);

export const useGlobalLoading = () => {
  const context = useContext(GlobalLoadingContext);
  if (!context) {
    throw new Error('useGlobalLoading must be used within GlobalLoadingProvider');
  }
  return context;
};

interface GlobalLoadingProviderProps {
  children: ReactNode;
}

export const GlobalLoadingProvider: React.FC<GlobalLoadingProviderProps> = ({ children }) => {
  const [loadingSources, setLoadingSources] = useState<Set<string>>(new Set());

  const setLoading = (loading: boolean, source?: string) => {
    setLoadingSources(prev => {
      const newSources = new Set(prev);
      if (source) {
        if (loading) {
          newSources.add(source);
        } else {
          newSources.delete(source);
        }
      }
      return newSources;
    });
  };

  const isLoading = loadingSources.size > 0;

  return (
    <GlobalLoadingContext.Provider value={{ isLoading, setLoading, loadingSources }}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card p-6 rounded-lg shadow-lg flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">Chargement...</p>
          </div>
        </div>
      )}
    </GlobalLoadingContext.Provider>
  );
};
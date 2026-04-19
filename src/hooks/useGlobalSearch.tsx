import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  action: () => void;
  category: 'navigation' | 'actions' | 'help' | 'user' | 'custom';
  priority?: number;
}

interface GlobalSearchContextType {
  isOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  searchResults: SearchResult[];
  addSearchResults: (results: SearchResult[]) => void;
  removeSearchResults: (ids: string[]) => void;
  clearCustomResults: () => void;
}

const GlobalSearchContext = createContext<GlobalSearchContextType | null>(null);

interface GlobalSearchProviderProps {
  children: ReactNode;
}

export function GlobalSearchProvider({ children }: GlobalSearchProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customResults, setCustomResults] = useState<SearchResult[]>([]);

  const openSearch = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setIsOpen(false);
  }, []);

  const addSearchResults = useCallback((results: SearchResult[]) => {
    setCustomResults(prev => {
      // Remove existing results with same IDs
      const filtered = prev.filter(r => !results.find(nr => nr.id === r.id));
      // Add new results
      return [...filtered, ...results];
    });
  }, []);

  const removeSearchResults = useCallback((ids: string[]) => {
    setCustomResults(prev => prev.filter(r => !ids.includes(r.id)));
  }, []);

  const clearCustomResults = useCallback(() => {
    setCustomResults([]);
  }, []);

  const value: GlobalSearchContextType = {
    isOpen,
    openSearch,
    closeSearch,
    searchResults: customResults,
    addSearchResults,
    removeSearchResults,
    clearCustomResults,
  };

  return (
    <GlobalSearchContext.Provider value={value}>
      {children}
    </GlobalSearchContext.Provider>
  );
}

export function useGlobalSearch() {
  const context = useContext(GlobalSearchContext);
  if (!context) {
    throw new Error('useGlobalSearch must be used within a GlobalSearchProvider');
  }
  return context;
}

// Hook pour les composants qui veulent ajouter des résultats de recherche
export function useSearchResults(results: SearchResult[]) {
  const { addSearchResults, removeSearchResults } = useGlobalSearch();

  // Add results when component mounts
  React.useEffect(() => {
    if (results.length > 0) {
      addSearchResults(results);
    }

    // Clean up when component unmounts
    return () => {
      if (results.length > 0) {
        removeSearchResults(results.map(r => r.id));
      }
    };
  }, [results, addSearchResults, removeSearchResults]);
}

// Hook pour les raccourcis clavier personnalisés
export function useSearchShortcuts(shortcuts: Record<string, () => void>) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const isModifier = e.metaKey || e.ctrlKey || e.altKey || e.shiftKey;

      if (isModifier) {
        const modifierKey = [];
        if (e.metaKey) modifierKey.push('meta');
        if (e.ctrlKey) modifierKey.push('ctrl');
        if (e.altKey) modifierKey.push('alt');
        if (e.shiftKey) modifierKey.push('shift');

        const combo = [...modifierKey, key].join('+');

        if (shortcuts[combo]) {
          e.preventDefault();
          shortcuts[combo]();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// Hook pour la recherche rapide avec des patterns prédéfinis
export function useQuickSearch() {
  const { openSearch } = useGlobalSearch();

  const openSearchWithQuery = useCallback((query: string) => {
    openSearch();
    // La query sera traitée par le composant GlobalSearch
    setTimeout(() => {
      const input = document.querySelector('[cmdk-input]') as HTMLInputElement;
      if (input) {
        input.value = query;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, 100);
  }, [openSearch]);

  return {
    openSearchWithQuery,
    openSearch,
  };
}

// Types pour les résultats de recherche par catégorie
export interface NavigationResult extends Omit<SearchResult, 'category'> {
  category: 'navigation';
  path: string;
}

export interface ActionResult extends Omit<SearchResult, 'category'> {
  category: 'actions';
  requiresAuth?: boolean;
}

export interface HelpResult extends Omit<SearchResult, 'category'> {
  category: 'help';
  type: 'article' | 'faq' | 'contact' | 'video';
}

export interface UserResult extends Omit<SearchResult, 'category'> {
  category: 'user';
  type: 'profile' | 'settings' | 'logout' | 'login';
}

export interface CustomResult extends Omit<SearchResult, 'category'> {
  category: 'custom';
  source: string; // nom du composant qui a ajouté ce résultat
}

// Fonctions utilitaires pour créer des résultats de recherche
export const createNavigationResult = (
  id: string,
  title: string,
  path: string,
  icon: React.ComponentType<{ className?: string }>,
  description?: string,
  shortcut?: string
): NavigationResult => ({
  id,
  title,
  description,
  icon,
  shortcut,
  action: () => {
    window.location.href = path;
  },
  category: 'navigation',
  path,
});

export const createActionResult = (
  id: string,
  title: string,
  action: () => void,
  icon: React.ComponentType<{ className?: string }>,
  description?: string,
  requiresAuth = false
): ActionResult => ({
  id,
  title,
  description,
  icon,
  action,
  requiresAuth,
  category: 'actions',
});

export const createHelpResult = (
  id: string,
  title: string,
  path: string,
  type: 'article' | 'faq' | 'contact' | 'video',
  icon: React.ComponentType<{ className?: string }>,
  description?: string
): HelpResult => ({
  id,
  title,
  description,
  icon,
  action: () => {
    window.location.href = path;
  },
  category: 'help',
  type,
});

export const createUserResult = (
  id: string,
  title: string,
  action: () => void,
  type: 'profile' | 'settings' | 'logout' | 'login',
  icon: React.ComponentType<{ className?: string }>,
  description?: string
): UserResult => ({
  id,
  title,
  description,
  icon,
  action,
  category: 'user',
  type,
});

export const createCustomResult = (
  id: string,
  title: string,
  action: () => void,
  source: string,
  icon: React.ComponentType<{ className?: string }>,
  description?: string,
  priority = 0
): CustomResult => ({
  id,
  title,
  description,
  icon,
  action,
  priority,
  category: 'custom',
  source,
});
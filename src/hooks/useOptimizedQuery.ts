import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { useGlobalLoading } from '@/components/common/GlobalLoading';

interface OptimizedQueryOptions<TData, TError> extends Omit<UseQueryOptions<TData, TError>, 'onSuccess' | 'onError'> {
  loadingKey?: string;
  showGlobalLoading?: boolean;
}

export const useOptimizedQuery = <TData = unknown, TError = Error>(
  options: OptimizedQueryOptions<TData, TError>
) => {
  const { setLoading } = useGlobalLoading();
  const { loadingKey, showGlobalLoading = true, ...queryOptions } = options;

  // Gérer le chargement global
  useEffect(() => {
    if (showGlobalLoading && loadingKey) {
      setLoading(true, loadingKey);
    }
  }, [showGlobalLoading, loadingKey, setLoading]);

  const onSuccess = useCallback(() => {
    if (showGlobalLoading && loadingKey) {
      setLoading(false, loadingKey);
    }
  }, [showGlobalLoading, loadingKey, setLoading]);

  const onError = useCallback(() => {
    if (showGlobalLoading && loadingKey) {
      setLoading(false, loadingKey);
    }
  }, [showGlobalLoading, loadingKey, setLoading]);

  return useQuery({
    ...queryOptions,
    onSuccess,
    onError,
    staleTime: queryOptions.staleTime || 10 * 60 * 1000, // 10 minutes par défaut
    refetchOnWindowFocus: false, // Désactiver par défaut pour éviter les rechargements inutiles
  });
};
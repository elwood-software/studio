'use client';

import {
  useQuery,
  type UseQueryResult,
  type UseQueryOptions,
} from '@tanstack/react-query';

import type {Episode} from '@/types';
import {Api} from './api';
import {useAppContext} from '@/hooks/use-app-context';

export function useEpisode(
  id: string | null,
  options?: Omit<UseQueryOptions<Episode | undefined>, 'queryKey' | 'queryFn'>,
): UseQueryResult<Episode | undefined> {
  const [{client}] = useAppContext();

  return useQuery({
    enabled: !!id,
    ...options,
    queryKey: ['episode', id],
    queryFn: () => {
      if (!id) {
        throw new Error('No episode ID provided');
      }

      return Api.client(client).episode(id);
    },
  });
}

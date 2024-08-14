'use client';

import {
  useQuery,
  type UseQueryResult,
  type UseQueryOptions,
} from '@tanstack/react-query';

import type {Episode} from '@/types';
import {Api} from './api';
import {useAppContext} from '@/hooks/use-app-context';

export function useShowEpisodes(
  showId: string,
  options?: Omit<UseQueryOptions<Episode[]>, 'queryKey' | 'queryFn'>,
): UseQueryResult<Episode[]> {
  const [{client}] = useAppContext();

  return useQuery({
    ...options,
    queryKey: ['episodes'],
    queryFn: () => Api.client(client).showEpisodes(showId),
  });
}

'use client';

import {
  useQuery,
  type UseQueryResult,
  type UseQueryOptions,
} from '@tanstack/react-query';

import type {Episode} from '@/types';
import {Api, type EpisodesFilter} from './api';
import {useAppContext} from '@/hooks/use-app-context';

export function useEpisodes(
  filter: EpisodesFilter = {},
  options?: Omit<UseQueryOptions<Episode[]>, 'queryKey' | 'queryFn'>,
): UseQueryResult<Episode[]> {
  const [{client}] = useAppContext();

  return useQuery({
    ...options,
    queryKey: ['entitlements'],
    queryFn: () => Api.client(client).episodes(filter),
  });
}

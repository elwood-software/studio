'use client';

import {
  useQuery,
  type UseQueryResult,
  type UseQueryOptions,
} from '@tanstack/react-query';

import type {Show} from '@/types';
import {Api} from './api';
import {useAppContext} from '@/hooks/use-app-context';

export type UseShowResult = UseQueryResult<Show | undefined>;

export function useShow(
  id: string,
  options?: Omit<UseQueryOptions<Show | undefined>, 'queryKey' | 'queryFn'>,
): UseShowResult {
  const [{client}] = useAppContext();

  return useQuery({
    ...options,
    queryKey: ['show', id],
    queryFn: () => Api.client(client).show(id),
  });
}

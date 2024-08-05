'use client';

import {
  useQuery,
  type UseQueryResult,
  type UseQueryOptions,
} from '@tanstack/react-query';

import {Plan} from '@/types';
import {Api} from './api';

export function usePlans(
  options?: Omit<UseQueryOptions<Plan[]>, 'queryKey' | 'queryFn'>,
): UseQueryResult<Plan[]> {
  console.log('sss');

  return useQuery({
    ...options,
    queryKey: ['plans'],
    queryFn: () => Api.client().plans(),
  });
}

'use client';

import {
  useQuery,
  type UseQueryResult,
  type UseQueryOptions,
} from '@tanstack/react-query';

import type {Subscription} from '@/types';
import {Api, type SubscriptionsFilter} from './api';
import {useAppContext} from '@/hooks/use-app-context';

export function useSubscriptions(
  filter: SubscriptionsFilter = {},
  options?: Omit<UseQueryOptions<Subscription[]>, 'queryKey' | 'queryFn'>,
): UseQueryResult<Subscription[]> {
  const [{client}] = useAppContext();

  return useQuery({
    ...options,
    queryKey: ['subscriptions'],
    queryFn: () => Api.client(client).subscriptions(filter),
  });
}

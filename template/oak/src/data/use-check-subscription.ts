'use client';

import {
  useQuery,
  type UseQueryResult,
  type UseQueryOptions,
} from '@tanstack/react-query';

import type {Subscription} from '@/types';
import {Api} from './api';
import {useAppContext} from '@/hooks/use-app-context';

export function useCheckSubscriptions(
  plan_id: string,
  options?: Omit<
    UseQueryOptions<Subscription | undefined>,
    'queryKey' | 'queryFn'
  >,
): UseQueryResult<Subscription | undefined> {
  const [{client}] = useAppContext();

  return useQuery({
    ...options,
    queryKey: ['check-subscriptions'],
    queryFn: () => Api.client(client).checkSubscription(plan_id),
  });
}

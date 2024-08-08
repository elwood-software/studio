'use client';

import {
  useQuery,
  type UseQueryResult,
  type UseQueryOptions,
} from '@tanstack/react-query';

import type {Entitlement} from '@/types';
import {Api, type EntitlementsFilter} from './api';
import {useAppContext} from '@/hooks/use-app-context';

export function useEntitlements(
  filter: EntitlementsFilter = {},
  options?: Omit<UseQueryOptions<Entitlement[]>, 'queryKey' | 'queryFn'>,
): UseQueryResult<Entitlement[]> {
  const [{client}] = useAppContext();

  return useQuery({
    ...options,
    queryKey: ['entitlements'],
    queryFn: () => Api.client(client).entitlements(filter),
  });
}

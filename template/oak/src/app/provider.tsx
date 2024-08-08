'use client';

import {useState, type PropsWithChildren} from 'react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {
  AppContextProvider,
  type AppContextProviderProps,
} from '@/hooks/use-app-context';

export type ProviderProps = AppContextProviderProps;

export function Provider(props: PropsWithChildren<AppContextProviderProps>) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnMount: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AppContextProvider {...props}>{props.children}</AppContextProvider>
    </QueryClientProvider>
  );
}

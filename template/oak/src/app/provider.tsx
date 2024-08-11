'use client';

import {useState, type PropsWithChildren} from 'react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {
  AppContextProvider,
  type AppContextProviderProps,
} from '@/hooks/use-app-context';
import {PlayControllerProvider} from '@/hooks/use-play-controller';

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
      <AppContextProvider {...props}>
        <PlayControllerProvider>{props.children}</PlayControllerProvider>
      </AppContextProvider>
    </QueryClientProvider>
  );
}

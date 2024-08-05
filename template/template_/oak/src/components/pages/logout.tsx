'use client';

import {useAppContext} from '@/hooks/use-app-context';
import {useEffect} from 'react';

import {Spinner} from '@/components/spinner';

export function Logout() {
  const [{client}] = useAppContext();

  useEffect(() => {
    client?.auth.signOut().finally(() => {
      window.location.href = '/';
    });
  }, []);

  return (
    <div className="size-full flex items-center justify-center">
      <Spinner />
    </div>
  );
}

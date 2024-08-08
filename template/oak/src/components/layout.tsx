'use client';

import {PropsWithChildren, ReactNode, useEffect, useState} from 'react';

import {default as Link} from 'next/link';
import {Button} from '@/components/ui/button';
import {useAppContext} from '@/hooks/use-app-context';
import {cn} from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import {LayoutPlayer} from './layout-player';

export type LayoutProps = {
  sidebar: ReactNode;
};

export function Layout(props: PropsWithChildren<LayoutProps>) {
  const [{isAuthenticated, user, site}] = useAppContext();
  const [ready, setReady] = useState(isAuthenticated !== null);

  useEffect(() => {
    setReady(isAuthenticated !== null);
  }, [isAuthenticated]);

  return (
    <div className="w-screen h-screen grid grid-cols-[1fr_4fr]">
      <div className="bg-muted/50 border-r p-12">
        <figure className="mb-6">
          <Link href="/" className="">
            <img src={site?.artwork} className="w-full" />
          </Link>
        </figure>

        <div>
          <strong className="text-xl font-extrabold block mb-1">
            {site?.name}
          </strong>
          <p>{site?.description}</p>
        </div>

        {props.sidebar}
      </div>
      <div className="size-full grid grid-rows-[60px_minmax(0,_1fr)] min-h-1">
        <header className="flex justify-between border-b">
          <div></div>
          <div className="flex justify-end items-center px-12">
            <div
              className={cn('transition-opacity duration-75 space-x-2', {
                'opacity-0': !ready,
              })}>
              {isAuthenticated === false && (
                <>
                  <Button asChild variant="ghost">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild variant="default">
                    <Link href="/subscribe">Subscribe</Link>
                  </Button>
                </>
              )}
              {isAuthenticated === true && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost">Hello {user?.email}</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuItem>
                      <Link href="/account/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href="/account/billing">Subscription</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Appearance</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup
                      value={'dark'}
                      onValueChange={() => {}}>
                      <DropdownMenuRadioItem value="light">
                        Light
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="dark">
                        Dark
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="system">
                        System
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Link href="/logout">Log Out</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </header>
        <div className="size-full grid grid-rows-[1fr_minmax(auto,_80px)]">
          <div className="flex-grow size-full overflow-y-auto overscroll-auto">
            {props.children}
          </div>
          <LayoutPlayer />
        </div>
      </div>
    </div>
  );
}

'use client';

import {PropsWithChildren, ReactNode, useRef, useEffect, useState} from 'react';
import {default as Link} from 'next/link';
import {
  SunIcon,
  HeadphonesIcon,
  LandmarkIcon,
  LogOutIcon,
  CircleHelpIcon,
  CircleUserIcon,
} from 'lucide-react';
import {useScroll} from 'react-use';

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
import {MinPlayer} from './player/mini';

import {CustomEventName} from '@/lib/events';

export type LayoutProps = {
  sidebar: ReactNode;
};

export function Layout(props: PropsWithChildren<LayoutProps>) {
  const [{isAuthenticated, site, theme}] = useAppContext();
  const [ready, setReady] = useState(isAuthenticated !== null);
  const scrollingRef = useRef<HTMLDivElement>(null);
  const scrollPosition = useScroll(scrollingRef);

  useEffect(() => {
    document.dispatchEvent(
      new CustomEvent(CustomEventName.ScrollTargetChange, {
        detail: [scrollPosition.x, scrollPosition.y],
      }),
    );
  }, [scrollPosition.x, scrollPosition.y]);

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
                <>
                  <Button asChild variant="outline">
                    <Link
                      href="/listen"
                      className="flex items-center space-x-2.5">
                      <HeadphonesIcon className="size-[1rem]" />
                      <span className="sr-only">Subscriptions</span>
                    </Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        <CircleUserIcon className="size-[1rem]" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 mr-3">
                      <DropdownMenuItem>
                        <Link
                          href="/account/subscriptions"
                          className="flex items-center space-x-2.5">
                          <HeadphonesIcon className="size-[1rem] text-muted-foreground" />
                          <span>Subscriptions</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Link
                          href="/account/profile"
                          className="flex items-center space-x-2.5">
                          <CircleUserIcon className="size-[1rem] text-muted-foreground" />
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Link
                          href="/account/billing"
                          className="flex items-center space-x-2.5">
                          <LandmarkIcon className="size-[1rem] text-muted-foreground" />
                          <span>Billing</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="flex items-center space-x-2.5">
                        <SunIcon className="size-[1rem] text-muted-foreground" />
                        <span>Appearance</span>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuRadioGroup
                        value={theme?.theme}
                        onValueChange={value => {
                          theme?.setTheme(value);
                        }}>
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
                        <Link
                          href="/logout"
                          className="flex items-center space-x-2.5">
                          <CircleHelpIcon className="size-[1rem] text-muted-foreground" />
                          <span>Support</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Link
                          href="/logout"
                          className="flex items-center space-x-2.5">
                          <LogOutIcon className="size-[1rem] text-muted-foreground" />
                          <span>Log Out</span>
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>
        </header>
        <div className="size-full grid grid-rows-[1fr_minmax(auto,_max-content)]">
          <div
            ref={scrollingRef}
            className="flex-grow size-full overflow-y-auto overscroll-auto"
            id="scrolling-target">
            {props.children}
          </div>

          <MinPlayer className="border-t py-6 px-6" />
        </div>
      </div>
    </div>
  );
}

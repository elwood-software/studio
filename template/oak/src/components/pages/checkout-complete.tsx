'use client';

import {useEffect, useRef, useState} from 'react';
import Link from 'next/link';

import {Button} from '@/components/ui/button';
import {Confetti, type ConfettiRef} from '@/components/ui/confetti';
import {useAppContext} from '@/hooks/use-app-context';
import {useSubscriptions} from '@/data/use-subscription';
import {useEntitlements} from '@/data/use-entitlements';
import {useCheckSubscriptions} from '@/data/use-check-subscription';
import {Spinner} from '@/components/spinner';
import {Card, CardHeader, CardContent} from '@/components/ui/card';
import type {Subscription} from '@/types';
import {WithShow} from '@/components/with-show';

export const dynamic = 'force-dynamic';

export type CheckoutCompletePageProps = {
  plan_id: string;
  initialData?: Subscription[];
};

export function CheckoutCompletePage(props: CheckoutCompletePageProps) {
  const [found, setFound] = useState(false);
  const ref = useRef<ConfettiRef>(null);
  const [{isAuthenticated}] = useAppContext();
  const query = useSubscriptions(
    {
      plan_id: props.plan_id,
    },
    {
      initialData: props.initialData,
      refetchInterval: found === true ? false : 1000 * 10,
      enabled: isAuthenticated === true,
    },
  );

  const thisSubscription = query.data?.find(
    item => item.plan_id === props.plan_id,
  );

  const entitlementsQuery = useEntitlements(
    {
      subscription_id: thisSubscription?.id,
    },
    {
      enabled: !!thisSubscription?.id,
    },
  );

  const entitlements = entitlementsQuery.data ?? [];

  // check every two minutes to see if the subscription is active
  // ideally this will never fire as the webhooks will update the subscription
  useCheckSubscriptions(props.plan_id, {
    refetchInterval: 1000 * 60 * 2,
    enabled: !found,
  });

  useEffect(() => {
    if (thisSubscription) {
      setTimeout(() => ref.current?.fire({}), 100);
      setFound(true);
    }
  }, [isAuthenticated, thisSubscription?.id]);

  if (isAuthenticated === false) {
    return <div>You must be logged in</div>;
  }

  if (!thisSubscription) {
    return (
      <div className="size-full flex items-center justify-center flex-col">
        <h1 className="text-6xl font-extrabold mb-1">Processing...</h1>
        <h2 className="text-muted-foreground mb-6">
          We're completing your subscription. It will just be one second.
        </h2>
        <Spinner />
      </div>
    );
  }

  return (
    <div className="size-full flex items-center flex-col">
      <header className="mb-12">
        <div className="flex items-center justify-center flex-col">
          <h1 className="text-6xl mb-1 font-extrabold flex flex-col items-center justify-center pt-48 relative">
            <span className="mb-2">🎉</span>
            <span> Congratulations!</span>

            <Confetti ref={ref} className="absolute top-0 left-0 size-full" />
          </h1>

          <h2>
            Check out all the awesome content you have access to. If you need
            any help getting started, read the FAQ
          </h2>
        </div>
      </header>
      <div className="grid grid-cols-3 mx-12 gap-12 z-50">
        {entitlements.map(item => {
          return (
            <WithShow
              id={item.id}
              key={`CheckoutConfirmationEntitlement-${item.id}`}>
              {({data}) => {
                return (
                  <Card>
                    <CardHeader>
                      <h3>{data?.title ?? ''}</h3>
                    </CardHeader>
                    <CardContent>
                      this is the thing about the thing
                      <input
                        type="url"
                        defaultValue={
                          new URL(`feed/${item.id}`, window.origin).href
                        }
                      />
                    </CardContent>
                    <div className="bg-muted border-t rounded-b-lg py-3 px-6">
                      <Button asChild variant="outline" className="w-full">
                        <Link href="">Listen Now</Link>
                      </Button>
                    </div>
                  </Card>
                );
              }}
            </WithShow>
          );
        })}
      </div>
    </div>
  );
}

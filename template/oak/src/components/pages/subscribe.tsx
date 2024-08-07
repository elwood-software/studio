'use client';

import {type MouseEvent} from 'react';
import type {Plan} from '@/types';
import {usePlans} from '@/data/use-plans';

import {PlanList} from '@/components/plans/plans';

export type SubscribePageProps = {
  plans: Plan[];
};

export function SubscribePage(props: SubscribePageProps) {
  const {data} = usePlans({
    // initialData: props.plans ?? [],
  });

  function onSubscribeClick(e: MouseEvent, planId: string, priceId: string) {}

  return (
    <div className="flex space-x-3 items-center flex-col">
      <header className="py-12 flex items-center justify-center flex-col">
        <h1 className="text-6xl font-extrabold">Subscribe</h1>
        <h2 className="text-xl text-muted-foreground">Pick your plan</h2>
      </header>

      <PlanList plans={data ?? []} onSubscribeClick={onSubscribeClick} />
    </div>
  );
}

'use client';

import {type MouseEvent} from 'react';
import type {Plan} from '@/types';
import {usePlans} from '@/data/use-plans';

import {PlanList} from '@/components/plans';

export type SubscribePageProps = {
  plans: Plan[];
};

export function SubscribePage(props: SubscribePageProps) {
  const {data} = usePlans({
    // initialData: props.plans ?? [],
  });

  function onSubscribeClick(e: MouseEvent, planId: string, priceId: string) {}

  return (
    <div className="flex space-x-3">
      <PlanList plans={data ?? []} onSubscribeClick={onSubscribeClick} />
    </div>
  );
}

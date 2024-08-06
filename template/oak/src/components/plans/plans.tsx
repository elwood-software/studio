'use client';

import type {Plan} from '@/types';
import {usePlans} from '@/data/use-plans';

import {PlanItem, type PlanItemProps} from './item';

export type PlanListProps = {
  plans: Plan[];
  onSubscribeClick: PlanItemProps['onSubscribeClick'];
};

export function PlanList(props: PlanListProps) {
  const {data} = usePlans({
    initialData: props.plans ?? [],
  });

  return (
    <div className="grid grid-cols-3 gap-6 p-6">
      {data?.map(item => {
        return (
          <div key={`subscribe-plan-${item.id}`}>
            <PlanItem plan={item} onSubscribeClick={props.onSubscribeClick} />
          </div>
        );
      })}
    </div>
  );
}

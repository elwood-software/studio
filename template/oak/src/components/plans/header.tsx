'use client';
import {PropsWithChildren, ReactNode} from 'react';

import type {Plan} from '@/types';

import {CardDescription, CardHeader, CardTitle} from '@/components/ui/card';

export type PlanItemProps = {
  plan: Plan;
  prepend?: ReactNode;
};

export function PlanHeader(props: PropsWithChildren<PlanItemProps>) {
  const {plan} = props;

  return (
    <CardHeader className="border-b">
      {props.prepend}
      <CardTitle>{plan.title}</CardTitle>
      <CardDescription>
        Make changes to your account here. Click save when you're done.
      </CardDescription>
      {props.children}
    </CardHeader>
  );
}

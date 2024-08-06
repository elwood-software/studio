'use client';
import {MouseEvent, useState} from 'react';
import {default as Link} from 'next/link';
import {ChevronRight, ArrowLeft} from 'lucide-react';

import type {Plan} from '@/types';

import {Button} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Currency} from '@/components/currency';
import {PlanHeader} from '@/components/plans/header';
import {PlanPrices} from '@/components/plans/prices';

export type PlanItemProps = {
  plan: Plan;
  onSubscribeClick(e: MouseEvent, planId: string, priceId: string): void;
  showFeatures?: boolean;
  showSubscribeButton?: boolean;
};

export function PlanItem(props: PlanItemProps) {
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);
  const {plan} = props;
  const selectedPriceId = selectedPrice ?? plan.prices[0].id;

  return (
    <Card>
      <PlanHeader plan={plan}>
        <PlanPrices plan={plan} onChange={setSelectedPrice} className="pt-3" />
      </PlanHeader>
      <CardContent className="space-y-2">
        {props.showFeatures !== false && plan.features}
      </CardContent>
      {props.showSubscribeButton !== false && (
        <CardFooter>
          <Button
            onClick={e => {
              props.onSubscribeClick(e, plan.id, selectedPriceId);
            }}
            className="w-full"
            asChild>
            <Link
              href={`/subscribe/checkout?plan=${plan.id}&price=${selectedPriceId}`}>
              Subscribe
            </Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

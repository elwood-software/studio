'use client';
import {MouseEvent, useState} from 'react';
import {default as Link} from 'next/link';

import type {Plan} from '@/types';
import {usePlans} from '@/data/use-plans';
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
export type PlanItemProps = {
  plan: Plan;
  onSubscribeClick(e: MouseEvent, planId: string, priceId: string): void;
};

export function PlanItem(props: PlanItemProps) {
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);
  const {plan} = props;
  const selectedPriceId = selectedPrice ?? plan.prices[0].id;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{plan.title}</CardTitle>
        <CardDescription>
          Make changes to your account here. Click save when you're done.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Tabs
          defaultValue={selectedPriceId}
          onValueChange={value => setSelectedPrice(value)}>
          <TabsList className="">
            {plan.prices.map(price => (
              <TabsTrigger
                value={price.id}
                key={`subscribe-plan-${plan.id}-${price.id}`}>
                {price.per}
              </TabsTrigger>
            ))}
          </TabsList>
          {plan.prices.map(price => (
            <TabsContent
              value={price.id}
              key={`subscribe-plan-${plan.id}-${price.id}-content`}>
              <strong className="text-3xl">
                <Currency value={plan.prices[0].price} />
              </strong>
              /month
            </TabsContent>
          ))}
        </Tabs>

        {plan.features}
      </CardContent>
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
    </Card>
  );
}

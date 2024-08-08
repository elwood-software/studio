'use client';

import {useState} from 'react';
import type {Plan} from '@/types';

import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Currency} from '@/components/currency';

export type PlanPricesProps = {
  plan: Plan;
  onChange(id: string): void;
  className?: string;
};

const title: Record<Plan['prices'][0]['per'], string> = {
  month: 'Month',
  year: 'Year',
  'one-time': 'Once',
  '3-months': '3 months',
  '6-months': '6 months',
};

const per: Record<Plan['prices'][0]['per'], string> = {
  month: 'per month',
  year: 'per year',
  'one-time': '',
  '3-months': 'every 3 months',
  '6-months': 'every 6 months',
};

export function PlanPrices(props: PlanPricesProps) {
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);
  const {plan} = props;
  const selectedPriceId = selectedPrice ?? plan.prices[0].id;

  console.log(plan);

  return (
    <Tabs
      className={props.className}
      defaultValue={selectedPriceId}
      onValueChange={value => {
        setSelectedPrice(value);
        props.onChange(value);
      }}>
      {plan.prices.length > 1 && (
        <TabsList className="">
          {plan.prices.map(price => (
            <TabsTrigger
              value={price.id}
              key={`subscribe-plan-${plan.id}-${price.id}`}>
              {title[price.per]}
            </TabsTrigger>
          ))}
        </TabsList>
      )}
      {plan.prices.map(item => (
        <TabsContent
          value={item.id}
          key={`subscribe-plan-${plan.id}-${item.id}-content`}>
          <strong className="text-3xl">
            <Currency value={item.price.amount} />
          </strong>
          /{per[item.per]}
        </TabsContent>
      ))}
    </Tabs>
  );
}

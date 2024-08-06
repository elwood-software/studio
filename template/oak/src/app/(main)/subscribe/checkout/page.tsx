import {redirect} from 'next/navigation';

import {CheckoutPage} from '@/components/pages/checkout';
import {Api} from '@/data/api';
import {serverFetch} from '@/lib/server-fetch';
import type {CheckoutActionState, CheckoutActionData} from '@/types';
import {action} from './action';

export const dynamic = 'force-dynamic';

export type PageProps = {
  searchParams: {
    plan: string;
    price: string;
  };
};

export default async function Page(props: PageProps) {
  const plans = await Api.server(serverFetch).plans();
  const plan = plans.find(plan => plan.id === props.searchParams.plan);

  const selectedPrice = plan?.prices.find(
    price => price.id === (props.searchParams.price ?? plan?.prices[0].id),
  );

  if (!plan || !selectedPrice) {
    return <div>You bad</div>;
  }

  async function onSubmit(
    prevState: CheckoutActionState,
    formData: CheckoutActionData,
  ) {
    'use server';

    const state = await action(prevState, formData);

    if (state.redirect_url) {
      redirect(state.redirect_url);
    }

    return state;
  }

  return (
    <CheckoutPage plan={plan} price={selectedPrice} formAction={onSubmit} />
  );
}

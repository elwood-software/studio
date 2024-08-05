import {headers} from 'next/headers';
import {redirect} from 'next/navigation';

import {CheckoutPage} from '@/components/pages/checkout';
import {Api} from '@/data/api';
import {serverFetch} from '@/lib/server-fetch';
import {checkoutFormSchema} from '@/lib/schemas';
import {createClient} from '@/utils/supabase/server';

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

  async function onSubmit(formData: FormData) {
    'use server';

    const client = createClient();
    const origin = headers().get('origin');
    const firstName = formData.get('first_name') as string;
    const lastName = formData.get('last_name') as string;
    const email = formData.get('email') as string;

    const result = checkoutFormSchema.parse({
      first_name: firstName,
      last_name: lastName,
      email,
    });

    if (!plan?.id && !selectedPrice?.id) {
      throw new Error('Plan or price not found');
    }

    // signup our user
    const password = crypto.randomUUID();
    const signUpResult = await client.auth.signUp({
      email: result.email,
      password,
    });

    if (signUpResult.error) {
      throw new Error('Unable to sign up');
    }

    const signInResult = await client.auth.signInWithPassword({
      email: result.email,
      password,
    });

    if (signInResult.error) {
      throw new Error('Unable to sign in');
    }

    const {checkout_url} = await fetchCreateCustomer(
      {
        first_name: result.first_name,
        last_name: result.last_name,
        email: result.email,
        plan_id: plan?.id,
        price_id: selectedPrice?.id,
        return_url: `${origin}/subscribe/checkout`,
        success_url: `${origin}/subscribe/checkout/complete`,
      },
      {
        headers: {
          Authorization: `Bearer ${signInResult.data.session.access_token}`,
        },
      },
    );

    if (!checkout_url) {
      throw new Error('No URL returned');
    }

    redirect(checkout_url);
  }

  return (
    <CheckoutPage
      plan={plan}
      price={selectedPrice}
      submitButtonProps={{formAction: onSubmit}}
    />
  );
}

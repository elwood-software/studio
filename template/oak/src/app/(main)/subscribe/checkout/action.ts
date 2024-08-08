'use server';

import {headers} from 'next/headers';

import {Api} from '@/data/api';
import {serverFetch} from '@/lib/server-fetch';
import {checkoutFormSchema} from '@/lib/schemas';
import {createClient} from '@/utils/supabase/server';

import type {CheckoutActionData, CheckoutActionState} from '@/types';

export async function action(
  _state: CheckoutActionState,
  data: CheckoutActionData,
): Promise<CheckoutActionState> {
  const client = createClient();
  const origin = headers().get('origin');

  // see if we already have a suer
  const currentUser = await client.auth.getUser();

  if (!data.plan_id && !data.price_id) {
    return {
      success: false,
      errors: ['Plan or price not found'],
    };
  }

  if (!currentUser.data?.user?.id) {
    const firstName = data['first_name'];
    const lastName = data['last_name'];
    const email = data['email'];

    const result = checkoutFormSchema.parse({
      first_name: firstName,
      last_name: lastName,
      email,
    });

    // signup our user
    const password = crypto.randomUUID();
    const signUpResult = await client.auth.signUp({
      email: result.email,
      password,
      options: {
        data: {
          first_name: result.first_name,
          last_name: result.last_name,
        },
      },
    });

    if (signUpResult.error) {
      return {
        success: false,
        errors: ['Unable to sign up'],
      };
    }

    const signInResult = await client.auth.signInWithPassword({
      email: result.email,
      password,
    });

    if (signInResult.error) {
      return {
        success: false,
        errors: ['Unable to sign in'],
      };
    }
  }

  try {
    const {access_token} = (await client.auth.getSession()).data.session ?? {};

    if (!access_token) {
      throw new Error('No access token');
    }

    const {checkout_url} = await Api.server(serverFetch).createCustomer(
      {
        ...data,
        return_url: `${origin}/subscribe/checkout?plan=${data.plan_id}&price=${data.price_id}`,
        success_url: `${origin}/subscribe/checkout/complete?plan=${data.plan_id}`,
      },
      {
        Authorization: `Bearer ${access_token}`,
      },
    );

    if (!checkout_url) {
      return {
        success: false,
        errors: ['No URL returned'],
      };
    }

    return {
      success: true,
      redirect_url: checkout_url,
    };
  } catch (e) {
    return {
      success: false,
      errors: [(e as Error).message],
    };
  }
}

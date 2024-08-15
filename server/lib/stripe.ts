import { assert, Stripe } from "../_deps.ts";
import { defaultInstanceId } from "../constants.ts";

export function getStripeWebhookSecret(): string {
  const secret = Deno.env.get("STRIPE_WEBHOOK_ENDPOINT_SECRET");
  assert(secret, "STRIPE_WEBHOOK_ENDPOINT_SECRET missing");
  return secret;
}

/**
 * create a stripe instance tied to stripe secret
 * @param apiKey
 * @returns
 */
export function createStripe(
  apiKey = Deno.env.get("STRIPE_SECRET_KEY"),
  stripeAccountId = Deno.env.get("STRIPE_ACCOUNT_ID"),
): Stripe {
  assert(apiKey, "STRIPE_SECRET_KEY is required");

  return new Stripe(apiKey, {
    httpClient: Stripe.createFetchHttpClient(),
    stripeAccount: stripeAccountId,
  });
}

/**
 * get the stripe account from the env
 * or fetch if from the cloud if it's not provided
 * in the env
 * @param instanceId
 * @returns
 */
export async function getStripeAccountId(
  instanceId: string = defaultInstanceId,
): Promise<string> {
  const envVar = Deno.env.get("STRIPE_ACCOUNT_ID");
  const cloudApiUrl = Deno.env.get("ELWOOD_CLOUD_API_URL") ??
    "https://api.elwood.cloud";

  if (envVar) {
    return envVar;
  }

  const response = await fetch(`${cloudApiUrl}/stripe/account/${instanceId}`);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch Stripe account ID: ${response.statusText}`,
    );
  }

  const id = (await response.json()).id;

  if (!id) {
    throw new Error("Stripe account ID not found");
  }

  return id;
}

export type UpsertStripePriceInput = {
  reference_id: string;
  params: Stripe.PriceCreateParams;
};

export async function upsertStripePrice(
  client: Stripe,
  input: UpsertStripePriceInput,
): Promise<Stripe.Price> {
  const { data } = await client.prices.search({
    query: `metadata['reference_id']: '${input.reference_id}'`,
  });

  if (data.length > 0) {
    return data[0];
  }

  return await client.prices.create({
    ...input.params,
    metadata: {
      ...(input.params.metadata ?? {}),
      reference_id: input.reference_id,
    },
  });
}

export type GetStripePriceInput = {
  reference_id: string;
  id?: never;
} | {
  reference_id?: never;
  id: string;
};

export async function getStripePrice(
  client: Stripe,
  input: GetStripePriceInput,
): Promise<Stripe.Price | null> {
  if (input.id) {
    return await client.prices.retrieve(input.id);
  }

  const { data } = await client.prices.search({
    query: `metadata['reference_id']: '${input.reference_id}'`,
  });

  if (data.length > 0) {
    return data[0];
  }

  return null;
}

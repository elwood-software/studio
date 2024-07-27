import { assert, Stripe } from "../_deps.ts";

/**
 * create a stripe instance tied to stripe secret
 * @param apiKey
 * @returns
 */
export function createStripe(
  apiKey = Deno.env.get("STRIPE_SECRET_KEY"),
): Stripe {
  assert(apiKey, "STRIPE_SECRET_KEY is required");

  return new Stripe(apiKey, {
    httpClient: Stripe.createFetchHttpClient(),
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
  instanceId: string = "00000000-0000-0000-0000-000000000000",
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

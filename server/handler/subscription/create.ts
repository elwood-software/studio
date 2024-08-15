import type { HandlerContext } from "../../types.ts";
import { assert, DBConstant, z } from "../../_deps.ts";
import { getStripeAccountId } from "../../lib/stripe.ts";

import { feed, subscription } from "../../service/mod.ts";

export const schema = z.object({
  node_id: z.string().uuid(),
  plan_id: z.string().uuid(),
  price_id: z.string().uuid(),
});

type Schema = z.infer<typeof schema>;

export async function handler(
  ctx: HandlerContext,
) {
  const { node_id, plan_id, price_id } = await ctx.req.json() as Schema;
  const user_id = "a00c37cb-a457-4511-963f-96ca60a44adc";

  // create a subscription for this customer
  const result = await subscription.create(ctx.var, {
    plan_id,
    node_id,
    user_id,
    price_id,
  });

  return ctx.json({
    id: result.subscription.id,
  });
}

import type { HandlerContext } from "@/types.ts";
import { assert, DBConstant, z } from "@/_deps.ts";
import { getStripeAccountId } from "@/lib/stripe.ts";

import { feed, subscription } from "@/service/mod.ts";

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
  const user_id = "48ee2fe0-e702-4ff1-a5e8-7461ef8711e0";

  // create a subscription for this customer
  const result = await subscription.create(ctx.var, {
    plan_id,
    node_id,
    user_id,
    price_id,
  });

  // we've created the subscription, now we need to figure out
  // what feed nodes we need to create for this user
  const { entitled_node_ids } = await feed.listEntitledFeedsBySubscription(
    ctx.var,
    {
      subscription_id: result.subscription.id,
    },
  );

  // create all feeds this user is entitled to based on the subscription
  await Promise.all(entitled_node_ids.map(async (node_id) => {
    await feed.create(ctx.var, {
      node_id,
      subscription_id: result.subscription.id,
    });
  }));

  return ctx.json({
    id: result.subscription.id,
  });
}

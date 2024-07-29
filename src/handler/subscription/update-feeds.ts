import type { HandlerContext } from "../../types.ts";
import { assert, DBConstant, z } from "../../_deps.ts";
import { getStripeAccountId } from "../../lib/stripe.ts";

import { feed } from "../../service/mod.ts";

export const schema = z.object({
  id: z.string().uuid(),
});

type Schema = z.infer<typeof schema>;

export async function handler(
  ctx: HandlerContext,
) {
  const { id } = await ctx.req.json() as Schema;

  // we've created the subscription, now we need to figure out
  // what feed nodes we need to create for this user
  const { entitled_node_ids } = await feed.listEntitledFeedsBySubscription(
    ctx.var,
    {
      subscription_id: id,
    },
  );

  // create all feeds this user is entitled to based on the subscription
  await Promise.all(entitled_node_ids.map(async (node_id) => {
    await feed.create(ctx.var, {
      node_id,
      subscription_id: id,
    });
  }));

  return ctx.json({
    id: id,
  });
}

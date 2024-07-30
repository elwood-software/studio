import type { HandlerContext } from "../../types.ts";
import { assert, DBConstant, z } from "../../_deps.ts";
import { getStripeAccountId } from "../../lib/stripe.ts";

import { feed, subscription } from "../../service/mod.ts";

export const schema = z.object({
  id: z.string().uuid(),
});

type Schema = z.infer<typeof schema>;

export async function handler(
  ctx: HandlerContext,
) {
  const { id } = ctx.req.param() as Schema;

  await subscription.verify(ctx.var, { subscriptionId: id });

  // we've created the subscription, now we need to figure out
  // what feed nodes we need to create for this user
  const { entitled_node_ids } = await feed.listEntitledFeedsBySubscription(
    ctx.var,
    {
      subscription_id: id,
    },
  );

  // create all feeds this user is entitled to based on the subscription
  const feeds = await Promise.all(entitled_node_ids.map(async (node_id) => {
    return await feed.create(ctx.var, {
      node_id,
      subscription_id: id,
    });
  }));

  return ctx.json({
    id: id,
    entitled_node_ids,
    feed_ids: feeds.map((f) => f.feed.id),
  });
}

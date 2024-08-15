import type { HandlerContext } from "../../types.ts";
import { z } from "../../_deps.ts";
import { entitlements, feed, subscription } from "../../service/mod.ts";

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
  const { customer_node_ids } = await entitlements.listForSubscription(
    ctx.var,
    {
      subscription_id: id,
    },
  );

  if (customer_node_ids.length === 0) {
    return ctx.json({
      entitlements: [],
    });
  }

  const nodes = await ctx.get("db").elwood.query.selectFrom("studio_node")
    .selectAll()
    .where("id", "in", customer_node_ids)
    .execute();

  return ctx.json({
    entitlements: await Promise.all(nodes.map(async (node) => {
      const [show] = await feed.getShow(ctx.var, node);

      console.log(show);

      return {
        type: node.category,
        feed_id: node.id,
        show: {
          id: show.id,
          title: show.content.title,
          description: show.content.description,
        },
      };
    })),
  });
}

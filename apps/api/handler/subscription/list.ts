import type { HandlerContext } from "../../types.ts";
import { assert, z } from "../../_deps.ts";

import { feed, subscription } from "../../service/mod.ts";

export const schema = z.object({
  plan_id: z.string().uuid().optional(),
});

type Schema = z.infer<typeof schema>;

export async function handler(
  ctx: HandlerContext,
) {
  const customerId = ctx.get("customer")?.id;

  assert(customerId, "missing customer id");

  const subscriptions = await ctx.get("db").elwood.query
    .selectFrom("studio_subscription")
    .selectAll()
    .where("customer_id", "=", customerId)
    .$if(
      !!ctx.req.query("plan_id"),
      (q) => q.where("plan_id", "=", ctx.req.query("plan_id") as string),
    )
    .execute();

  return ctx.json({
    subscriptions: await Promise.all(
      subscriptions.map(async (sub) => {
        // make sure the subscription is active
        const provider = await subscription.findOnProvider(ctx.var, {
          provider_id: sub.metadata?.stripe_id as string,
        });

        if (provider.length === 0) {
          return null;
        }

        return {
          id: sub.id,
          plan_id: sub.plan_id,
          status: sub.status,
          created_at: sub.created_at,
          updated_at: sub.updated_at,
          provider: provider[0],
        };
      }).filter(Boolean),
    ),
  });
}

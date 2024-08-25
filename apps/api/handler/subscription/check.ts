import type { HandlerContext } from "../../types.ts";
import { assert, DBConstant, z } from "../../_deps.ts";

import { entitlements, subscription } from "../../service/mod.ts";

export const schema = z.object({
  plan_id: z.string().uuid(),
});

type Schema = z.infer<typeof schema>;

export async function handler(
  ctx: HandlerContext,
) {
  const { plan_id } = await ctx.req.json() as Schema;
  const db = ctx.get("db").elwood.query;
  const customer = ctx.get("customer");

  assert(customer, "Customer not found");

  // find  their subscription on the db
  const currentSubscription = await db.selectFrom("studio_subscription")
    .select("id")
    .where(
      "plan_id",
      "=",
      plan_id,
    )
    .where("customer_id", "=", customer.id).executeTakeFirst();

  if (currentSubscription?.id) {
    return ctx.json({
      active: true,
      id: currentSubscription.id,
    });
  }

  // try to find the subscription on the provider
  const result = await subscription.findOnProvider(ctx.var, {
    customer_id: customer.id,
    plan_id,
  });

  assert(result.length > 0, "Subscription not found");

  const stripeSubscription = result[0];
  const newSubscription = await subscription.create(ctx.var, {
    plan_id: plan_id,
    price_id: stripeSubscription!.metadata.price_id!,
    customer_id: customer.id,
    stripe_subscription_id: stripeSubscription!.id,
  });

  // update the subscription with the stripe subscription id
  // and active it
  await db.updateTable("studio_subscription")
    .set({
      status: DBConstant.StudioSubscriptionStatuses.Active,
      metadata: {
        stripe_id: stripeSubscription!.id,
      },
    })
    .where("id", "=", newSubscription.subscription.id)
    .execute();

  // build their entitlements
  await entitlements.updateForSubscription(ctx.var, {
    subscription_id: newSubscription.subscription.id,
  });

  return ctx.json({
    active: true,
    id: newSubscription.subscription.id,
  });
}

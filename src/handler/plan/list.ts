import type { HandlerContext } from "@/types.ts";
import { assert, DBConstant, z } from "@/_deps.ts";
import { getStripeAccountId } from "@/lib/stripe.ts";

import { feed, subscription } from "@/service/mod.ts";
import { processRow } from "@/service/webhook.ts";

export const schema = z.object({});

type Schema = z.infer<typeof schema>;

export async function handler(
  ctx: HandlerContext,
) {
  const query = ctx.get("db").elwood.query;

  console.log(ctx.req.header("x-origin"));

  const plans = await query.selectFrom("studio_plan")
    .selectAll()
    .where(
      "status",
      "=",
      DBConstant.StudioPlanStatuses.Active,
    ).execute();

  return ctx.json({
    plans: plans.map((plan) => ({
      id: plan.id,
      title: plan.name,
      features: plan.description,
      prices: plan.prices?.map((price) => ({
        id: price.id,
        price: 9.99,
        per: "month",
      })),
      includes: [],
    })),
  });
}

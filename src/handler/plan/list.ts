import type { HandlerContext } from "@/types.ts";
import { DBConstant, z } from "@/_deps.ts";
import { getStripeAccountId } from "@/lib/stripe.ts";

export const schema = z.object({});

type Schema = z.infer<typeof schema>;

export async function handler(
  ctx: HandlerContext,
) {
  const query = ctx.get("db").elwood.query;
  const stripe = ctx.get("stripe");

  const plans = await query.selectFrom("studio_plan")
    .selectAll()
    .where(
      "status",
      "=",
      DBConstant.StudioPlanStatuses.Active,
    ).execute();

  const stripeAccount = await getStripeAccountId(ctx.get("instanceId"));

  return ctx.json({
    plans: await Promise.all(plans.map(async (plan) => {
      // get prices
      const stripePrices = (await stripe.prices.search({
        query: `active: 'true'`,
      }, { stripeAccount })).data;

      return {
        id: plan.id,
        title: plan.name,
        features: plan.description,
        prices: plan.prices?.map((price) => {
          const stripePrice = stripePrices.find((stripePrice) =>
            stripePrice.id === price.stripe_id
          );

          if (!stripePrice) {
            return;
          }

          return {
            id: price.id,
            price: stripePrice.unit_amount,
            per: "month",
            currency: stripePrice.currency,
          };
        }).filter(Boolean),
        includes: [],
      };
    })),
  });
}

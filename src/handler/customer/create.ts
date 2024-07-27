import type { HandlerContext } from "../../types.ts";
import { assert, DBConstant, z } from "../../_deps.ts";
import { getStripeAccountId } from "../../lib/stripe.ts";

export const schema = z.object({});

type Schema = z.infer<typeof schema>;

export async function handler(
  ctx: HandlerContext,
) {
  const stripe = ctx.get("stripe");
  const db = ctx.get("db").elwood;

  return ctx.json({
    id: "newSubscriptionId",
  });
}

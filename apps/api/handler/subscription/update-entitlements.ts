import type { HandlerContext } from "../../types.ts";
import { z } from "../../_deps.ts";

import { entitlements, subscription } from "../../service/mod.ts";

export const schema = z.object({
  id: z.string().uuid(),
});

type Schema = z.infer<typeof schema>;

export async function handler(
  ctx: HandlerContext,
) {
  const { id } = ctx.req.param() as Schema;

  await subscription.verify(ctx.var, { subscriptionId: id });

  await entitlements.updateForSubscription(ctx.var, {
    subscription_id: id,
  });

  return ctx.json({
    id,
  });
}

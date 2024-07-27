import { type HandlerContext } from "../types.ts";
import { z } from "../_deps.ts";
import { rss } from "../lib/rss-response.ts";

import { feed, subscription } from "../service/mod.ts";

export const schema = z.object({
  id: z.string().uuid(),
});

type Schema = z.infer<typeof schema>;

export async function handler(
  ctx: HandlerContext,
) {
  try {
    const { id } = ctx.req.param() as Schema;

    const result = await feed.compileRss(ctx.var, { id });

    await subscription.verify(ctx.var, { feedId: id });

    return rss(ctx, result.rss);
  } catch (err) {
    console.log(err.message);

    return rss(ctx, {
      error: "Unable to fetch feed",
    });
  }
}

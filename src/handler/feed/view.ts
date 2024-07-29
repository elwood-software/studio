import { type HandlerContext } from "@/types.ts";
import { z } from "@/_deps.ts";
import { rss } from "@/lib/rss-response.ts";
import { feed, subscription } from "@/service/mod.ts";

export const schema = z.object({
  id: z.string().uuid(),
});

type Schema = z.infer<typeof schema>;

export async function handler(
  ctx: HandlerContext,
) {
  try {
    const { id } = ctx.req.param() as Schema;

    const row = await ctx.var.db.elwood.query.selectFrom("studio_node")
      .selectAll()
      .where("id", "=", id)
      .where("category", "=", "FEED")
      .executeTakeFirstOrThrow();

    // if it's a public feed
    // there's no need to check the subscription
    if (row.sub_category !== "PUBLIC") {
      await subscription.verify(ctx.var, { feedId: id });
    }

    const result = await feed.compileRss(ctx.var, { feed: row });

    return rss(ctx, result.rss);
  } catch (err) {
    console.log(err.message);

    return rss(ctx, {
      error: "Unable to fetch feed",
    });
  }
}

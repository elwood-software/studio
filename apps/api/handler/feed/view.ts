import { type HandlerContext, JsonObject } from "../../types.ts";
import { xml, z } from "../../_deps.ts";
import { rss } from "../../lib/rss-response.ts";
import { feed, subscription } from "../../service/mod.ts";

export const schema = z.object({
  id: z.string().uuid(),
});

type Schema = z.infer<typeof schema>;

export async function handler(
  ctx: HandlerContext,
) {
  try {
    const { id } = ctx.req.param() as Schema;

    const row = await ctx.var.orm.studioNode(
      (qb) =>
        qb.where("id", "=", id)
          .where("category", "=", "FEED"),
    );

    // if it's a public feed
    // there's no need to check the subscription
    if (row.sub_category !== "PUBLIC") {
      await subscription.verify(ctx.var, { feedId: id });
    }

    const result = await feed.compileRss(ctx.var, { feed: row });

    return rss(ctx, result.rss);
  } catch (err) {
    console.log(err.message);
    const code = (err as JsonObject).code ?? "-1";

    return rss(ctx, {
      error: "Feed Not Available",
      "elwood:error": {
        "@code": code,
        message: xml.comment(
          [
            "",
            "Hello!",
            "This feed is not available.",
            "Please login and copy the feed URL agin.",
            "",
            "If you need help, you can email us at supper@elwood.studio or",
            "visit us at https://elwood.studio/support",
            "",
          ].join("\n"),
        ),
        support_url: "https://elwood.studio/support",
        error_url: `https://elwood.studio/docs/errors?code=${code}`,
      },
    });
  }
}

import type { HandlerContext, JsonObject } from "../../types.ts";
import { _, assert, z } from "../../_deps.ts";
import { feed } from "../../service/mod.ts";

export const schema = z.object({
  "id": z.string().uuid(),
});

export const querySchema = z.object({
  force: z.enum(["public", "private"]).optional(),
});

type Schema = z.infer<typeof schema>;
type QuerySchema = z.infer<typeof querySchema>;

export async function handler(
  ctx: HandlerContext,
) {
  const db = ctx.get("db").elwood.query;
  const { id } = ctx.req.param() as Schema;
  const { force: _ } = ctx.req.query() as QuerySchema;
  const customer = ctx.get("customer");
  const showFeed = await feed.getForShow(ctx.var, {
    id: id,
    customer,
  });

  assert(showFeed?.id, "Feed not found");

  // now get all episodes for this show
  const nodes = await db.selectFrom("studio_node")
    .select("id")
    .where(
      "parent_id",
      "=",
      showFeed.id,
    )
    .where("category", "=", "EPISODE")
    .execute();

  const items: JsonObject[] = [];

  for (const item of nodes) {
    const node = await ctx.get("orm").studioNode((q) =>
      q.where("id", "=", item.id)
    );

    const { audio_playback_license_id, video_playback_license_id } = await feed
      .getMediaForEpisode(ctx.var, {
        id: node.id,
        category: showFeed.sub_category as "PUBLIC" | "PRIVATE",
      });

    items.push({
      id: item.id,
      title: node.content?.title,
      description: node.content?.description,
      number: node.content?.number,
      published_at: node.publish_at,
      show_id: id,
      audio_playback_license_id,
      video_playback_license_id,
    });
  }

  return ctx.json({
    is_private_feed: showFeed.sub_category === "PRIVATE",
    items,
  });
}

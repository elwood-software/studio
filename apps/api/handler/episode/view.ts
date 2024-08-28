import type { HandlerContext } from "../../types.ts";
import { assert, z } from "../../_deps.ts";
import { feed } from "../../service/mod.ts";

export const schema = z.object({
  "id": z.string().uuid(),
});

type Schema = z.infer<typeof schema>;

export async function handler(
  ctx: HandlerContext,
) {
  const { id } = ctx.req.param() as Schema;

  const node = await ctx.get("orm").studioNode((q) => q.where("id", "=", id));

  assert(node.parent_id, "Parent not found");

  const showFeed = await feed.getForShow(ctx.var, {
    id: node.parent_id,
    customer: ctx.get("customer") ?? undefined,
  });

  assert(showFeed, "Show feed not found");

  const { audio_playback_license_id, video_playback_license_id } = await feed
    .getMediaForEpisode(ctx.var, {
      category: showFeed.sub_category as "PUBLIC" | "PRIVATE",
      id: node.id,
    });

  return ctx.json({
    feed_id: showFeed.id,
    feed_category: showFeed.sub_category,
    episode: {
      id: node.id,
      title: node.content?.title,
      description: node.content?.description,
      number: node.content?.number,
      published_at: node.publish_at,
      show_id: node.parent_id,
      audio_playback_license_id,
      video_playback_license_id,
    },
  });
}

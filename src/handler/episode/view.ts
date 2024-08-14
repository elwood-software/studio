import type { HandlerContext } from "@/types.ts";
import { assert, z } from "@/_deps.ts";
import { entitlements, feed } from "@/service/mod.ts";

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
    show_id: node.parent_id,
    customer: ctx.get("customer") ?? undefined,
  });

  assert(showFeed, "Show feed not found");

  let audio_playback_license_id: string | undefined;
  let video_playback_license_id: string | undefined;

  const audio = await ctx.get("orm").maybeStudioNode((q) => {
    return q.where("parent_id", "=", node.id)
      .where("category", "=", "AUDIO")
      .where("sub_category", "=", showFeed.sub_category);
  });

  if (audio?.id) {
    audio_playback_license_id = await entitlements.createPlaybackLicenseId(
      ctx.var,
      {
        node: audio,
      },
    );
  }

  const video = await ctx.get("orm").maybeStudioNode((q) => {
    return q.where("parent_id", "=", node.id)
      .where("category", "=", "VIDEO")
      .where("sub_category", "=", showFeed.sub_category);
  });

  if (video?.id) {
    video_playback_license_id = await entitlements.createPlaybackLicenseId(
      ctx.var,
      {
        node: video,
      },
    );
  }

  return ctx.json({
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

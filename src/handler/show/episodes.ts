import type { HandlerContext, JsonObject, StudioNode } from "@/types.ts";
import { _, assert, jwt, z } from "@/_deps.ts";
import { entitlements } from "@/service/mod.ts";

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

  const customerId = false; // ctx.get("customer");

  let feed: StudioNode | undefined;

  if (customerId) {
    const privateShowFeed = await db.selectFrom("studio_node")
      .selectAll()
      .where("parent_id", "=", id)
      .where("category", "=", "FEED")
      .where("sub_category", "=", "PRIVATE")
      .executeTakeFirstOrThrow();
  } else {
    feed = await db.selectFrom("studio_node")
      .selectAll()
      .where("parent_id", "=", id)
      .where("category", "=", "FEED")
      .where("sub_category", "=", "PUBLIC")
      .executeTakeFirstOrThrow();
  }

  assert(feed?.id, "Feed not found");

  console.log(feed.id);

  const nodes = await db.selectFrom("studio_node")
    .select("id")
    .where(
      "parent_id",
      "=",
      feed.id,
    )
    .where("category", "=", "EPISODE")
    .execute();

  const items: JsonObject[] = [];

  for (const item of nodes) {
    let audio_playback_license_id: string | undefined;
    let video_playback_license_id: string | undefined;

    const node = await ctx.get("orm").studioNode((q) =>
      q.where("id", "=", item.id)
    );

    const audio = await ctx.get("orm").maybeStudioNode((q) => {
      return q.where("parent_id", "=", node.id)
        .where("category", "=", "AUDIO")
        .where("sub_category", "=", feed.sub_category);
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
        .where("sub_category", "=", feed.sub_category);
    });

    if (video?.id) {
      video_playback_license_id = await entitlements.createPlaybackLicenseId(
        ctx.var,
        {
          node: video,
        },
      );
    }

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
    items,
  });
}

import type { HandlerContext } from "@/types.ts";
import { z } from "@/_deps.ts";

export const schema = z.object({
  "show_id": z.string().uuid(),
  "category": z.enum(["PUBLIC", "PRIVATE"]),
});

type Schema = z.infer<typeof schema>;

export async function handler(
  ctx: HandlerContext,
) {
  const episodes = await ctx.get("db").public.query
    .selectFrom("elwood_studio_content")
    .select("id")
    .where("category", "=", "EPISODE")
    .where("sub_category", "=", "PUBLIC")
    .execute();

  const nodes = [];

  for (const item of episodes) {
    const node = await ctx.get("orm").studioNode((q) =>
      q.where("id", "=", item.id)
    );

    const show = await ctx.get("orm").studioNode((q) =>
      q.where("parent_id", "=", node.parent_id)
    );

    nodes.push({
      id: item.id,
      title: node.content?.title,
      description: node.content?.description,
      number: node.content?.number,
      published_at: node.publish_at,
      show_id: show.id,
    });
  }

  console.log(nodes);

  return ctx.json({
    episodes: nodes,
  });
}

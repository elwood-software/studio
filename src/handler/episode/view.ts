import type { HandlerContext } from "@/types.ts";
import { z } from "@/_deps.ts";

export const schema = z.object({
  "id": z.string().uuid(),
});

type Schema = z.infer<typeof schema>;

export async function handler(
  ctx: HandlerContext,
) {
  const { id } = ctx.req.param() as Schema;

  const node = await ctx.get("orm").studioNode((q) => q.where("id", "=", id));

  return ctx.json({
    episode: {
      id: node.id,
      title: node.content?.title,
      description: node.content?.description,
      number: node.content?.number,
      published_at: node.publish_at,
      show_id: node.parent_id,
    },
  });
}

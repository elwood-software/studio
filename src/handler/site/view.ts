import type { HandlerContext } from "@/types.ts";
import { z } from "@/_deps.ts";

export const schema = z.object({
  "x-origin": z.string(),
});

type Schema = z.infer<typeof schema>;

export async function handler(
  ctx: HandlerContext,
) {
  const shows = await ctx.var.db.elwood.query.selectFrom("studio_node")
    .selectAll().where("category", "=", "SHOW").execute();

  return ctx.json({
    site: {
      active: true,
      layout: "network",
      name: "My Site",
      description: "This is my site",
      artwork: "https://placehold.co/600",
      main_node_id: "1",
      meta: {
        title: "podcast",
        description: "podcast",
      },
      shows: shows.map((show) => ({
        id: show.id,
        displayName: show.metadata?.title,
        name: show.name,
      })),
    },
  });
}

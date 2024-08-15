import type { HandlerContext, JsonObject, StudioNode } from "../../types.ts";
import { _, assert, jwt, z } from "../../_deps.ts";

export const schema = z.object({
  "id": z.string().uuid(),
});

type Schema = z.infer<typeof schema>;

export async function handler(
  ctx: HandlerContext,
) {
  const db = ctx.get("db").elwood.query;
  const { id } = ctx.req.param() as Schema;

  const node = await db.selectFrom("studio_node").selectAll().where(
    "id",
    "=",
    id,
  ).executeTakeFirstOrThrow();

  return ctx.json({
    show: {
      id: node.id,
      title: node.content.title,
      description: node.content.description,
    },
  });
}

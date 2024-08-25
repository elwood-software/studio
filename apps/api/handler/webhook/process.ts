import type { HandlerContext } from "../../types.ts";
import { z } from "../../_deps.ts";
import { webhook } from "../../service/mod.ts";

export const schema = z.object({
  id: z.string().uuid(),
});

export const bodySchema = z.object({
  force: z.boolean().optional().default(false),
});

type Schema = z.infer<typeof schema>;
type BodySchema = z.infer<typeof bodySchema>;

export async function handler(
  ctx: HandlerContext,
) {
  const { id } = ctx.req.param() as Schema;
  const { force } = (await ctx.req.json()) as BodySchema;

  // always add the webhook to the db
  // so we have something trackable
  const row = await ctx.var.db.elwood.query.selectFrom("studio_webhook")
    .selectAll()
    .where("id", "=", id)
    .$if(!force, (q) => q.where("is_processed", "=", false))
    .executeTakeFirstOrThrow();

  return ctx.json({
    success: true,
    log: await webhook.processRow(ctx.var, row),
  });
}

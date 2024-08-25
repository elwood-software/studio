import type { HandlerContext } from "../../types.ts";
import { z } from "../../_deps.ts";

export const schema = z.object({});

type Schema = z.infer<typeof schema>;

export async function handler(
  ctx: HandlerContext,
): Promise<Response> {
  return await Promise.resolve(ctx.json({
    ok: true,
  }));
}

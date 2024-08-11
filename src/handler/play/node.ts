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

  return ctx.redirect(
    "https://their-side-feed.vercel.app/episode-005.mp3",
    307,
  );
}

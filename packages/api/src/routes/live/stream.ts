import { z } from "zod";

import { publicProcedure } from "#/libs/trpc.js";
import streamController from "#/libs/stream.js";

const controlSchema = z.object({
  channel_id: z.number(),
  action: z.enum(["start", "stop", "sync"]),
});

export default publicProcedure.input(controlSchema).mutation(
  async ({ input, ctx }) => {
    const channel = await ctx.db.selectFrom("channel").where(
      "id",
      "=",
      input.channel_id,
    ).selectAll().executeTakeFirstOrThrow();

    switch (input.action) {
      case "start":
        return await streamController.start(ctx, channel);
      case "stop":
        return await streamController.stop();
      case "sync":
        return await streamController.update(ctx, channel);
      default:
        return {
          success: false,
        };
    }
  },
);

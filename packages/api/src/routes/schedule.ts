import { z } from "zod";

import { ChannelTypeName } from "@elwood/studio-db";

import { publicProcedure } from "#/libs/trpc.js";

const syncSchema = z.object({
  channel_id: z.string(),
});

export const sync = publicProcedure.input(syncSchema).mutation(
  async ({ input, ctx }) => {
    const channel = await ctx.db.insertInto("channel").values({
      display_name: input.display_name,
      type: ChannelTypeName.User,
      slug: "aaa",
    }).returning("id").executeTakeFirstOrThrow();

    return {
      id: channel.id,
    };
  },
);

import { z } from "zod";

import { ChannelTypeName, sql } from "@elwood/studio-db";

import { publicProcedure } from "#/libs/trpc.js";

const createSchema = z.object({
  display_name: z.string(),
  guid: z.string().optional(),
});

export const create = publicProcedure.input(createSchema).mutation(
  async ({ input, ctx }) => {
    if (input.guid) {
      const channel = await ctx.db.selectFrom("channel").select("id")
        .where("guid", "=", input.guid)
        .executeTakeFirst();

      if (channel) {
        return {
          id: channel.id,
          created: false,
        };
      }
    }

    const channel = await ctx.db.insertInto("channel").values({
      display_name: input.display_name,
      type: ChannelTypeName.User,
      slug: "aaa",
      data: {
        guid: input.guid,
      },
    }).returning("id").executeTakeFirstOrThrow();

    return {
      id: channel.id,
      created: true,
    };
  },
);

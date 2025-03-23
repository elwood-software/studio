import { z } from "zod";

import { ChannelTypeName } from "@elwood/studio-db";

import { publicProcedure } from "#/libs/trpc.js";

const createSchema = z.object({
  name: z.string(),
});

export const create = publicProcedure.input(createSchema).mutation(
  async ({ input, ctx }) => {
    const item = await ctx.db
      .insertInto("show")
      .values({
        name: input.name,
      })
      .returning("id")
      .executeTakeFirstOrThrow();

    return {
      id: item.id,
    };
  },
);

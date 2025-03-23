import { z } from "zod";

import { sql } from "@elwood/studio-db";

import { publicProcedure } from "#/libs/trpc.js";

const createSchema = z.object({
  name: z.string(),
  guid: z.string().optional(),
});

export const create = publicProcedure.input(createSchema).mutation(
  async ({ input, ctx }) => {
    if (input.guid) {
      const item = await ctx.db.selectFrom("show")
        .select("id")
        .where("guid", "=", input.guid)
        .executeTakeFirst();

      if (item) {
        return {
          id: item.id,
          created: false,
        };
      }
    }

    const item = await ctx.db
      .insertInto("show")
      .values({
        name: input.name,
        data: {
          guild: input.guid,
        },
      })
      .returning("id")
      .executeTakeFirstOrThrow();

    return {
      id: item.id,
    };
  },
);

import { z } from "zod";

import { publicProcedure } from "../../libs/trpc.js";

export const createSchema = z.object({
  type: z.string(),
});

export const create = publicProcedure.input(createSchema).mutation(
  async ({ input, ctx }) => {
    return {
      success: true,
    };
  },
);

export const reactSchema = z.object({}).optional();

export const read = publicProcedure.input(reactSchema).query(
  async ({ input, ctx }) => {
    return await ctx.queue.read();
  },
);

export const consumeSchema = z.object({
  count: z.number().min(1).max(10).default(1),
}).optional();

export const consume = publicProcedure.input(consumeSchema).mutation(
  async ({ input, ctx }) => {
    const messages = await ctx.queue.read({ count: input?.count });

    for (const { message } of messages) {
      console.log(message);
    }

    return {
      success: true,
    };
  },
);

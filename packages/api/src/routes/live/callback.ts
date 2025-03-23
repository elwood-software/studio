import { z } from "zod";

import { publicProcedure } from "../../libs/trpc.js";

const schema = z.object({
  type: z.string(),
});

const route = publicProcedure.input(schema).mutation(async ({ input, ctx }) => {
  return {
    success: true,
  };
});

export default route;

import { initTRPC } from "@trpc/server";

import { createContext } from "./context.js";

export type Context = Awaited<ReturnType<typeof createContext>>;

export const { router, createCallerFactory, procedure: publicProcedure } =
  initTRPC.context<Context>().create();

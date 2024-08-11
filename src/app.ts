import { Hono } from "@/_deps.ts";
import { HandlerContextVariables } from "@/types.ts";

import { registerMiddleware } from "@/middleware.ts";
import { registerRoutes } from "@/routes.ts";

// deno-lint-ignore require-await
export async function createApp() {
  const app = new Hono<{ Variables: HandlerContextVariables }>();

  registerMiddleware(app);
  registerRoutes(app);

  return app;
}

import { Hono } from "./deps.ts";

import state from "./libs/state.ts";
import { registerMiddleware } from "./libs/middleware.ts";
import { registerRoutes } from "./routes/register.ts";

const port = parseInt(Deno.env.get("PORT") ?? "3000", 10);
const hostname = Deno.env.get("HOSTNAME") ?? "0.0.0.0";

const app = new Hono();

await registerMiddleware(app);
await registerRoutes(app);

Deno.serve({ hostname, port }, app.fetch);

Deno.addSignalListener("SIGINT", () => {
  state.streams.forEach(([_, s]) => s.stop());
  Deno.exit();
});

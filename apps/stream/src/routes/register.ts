import { type Hono, proxy } from "../deps.ts";

import * as createRoute from "./create.ts";
import * as stopRoute from "./stop.ts";
import * as statusRoute from "./status.ts";
import * as updateRoute from "./update.ts";
import * as startRoute from "./start.ts";

// deno-lint-ignore require-await
export async function registerRoutes(app: Hono) {
  app.get("/", (c) => {
    return c.redirect("https://elwood.studio/live", 302);
  });

  // stream routes
  app.post("/", ...createRoute.validators, createRoute.handler);
  app.delete("/:id", ...stopRoute.validators, stopRoute.handler);
  app.get("/:id", ...statusRoute.validators, statusRoute.handler);
  app.put("/:id", ...startRoute.validators, startRoute.handler);
  app.patch("/:id", ...updateRoute.validators, updateRoute.handler);

  app.all("/generate/:path", (c) => {
    return proxy(`${c.var.generateApiUrl}/${c.req.param("path")}`);
  });

  app.all("/rtmp/:path", (c) => {
    return proxy(`${c.var.rtmpApiUrl}/${c.req.param("path")}`);
  });

  app.get("/health", (c) => {
    return c.text(":)");
  });

  app.get("/dump", async (c) => {
    return c.json({
      ...c.var,
      playlist: await c.get("db").selectFrom("playlist").selectAll().execute(),
    });
  });
}

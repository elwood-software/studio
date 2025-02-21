import { type Hono, proxy } from "../deps.ts";

import * as startRoute from "./start.ts";
import * as stopRoute from "./stop.ts";
import * as statusRoute from "./status.ts";

// deno-lint-ignore require-await
export async function registerRoutes(app: Hono) {
  app.get("/", (c) => {
    return c.redirect("https://elwood.studio/live", 302);
  });

  app.post("/start", ...startRoute.validators, startRoute.handler);
  app.delete("/stop/:by/:value", ...stopRoute.validators, stopRoute.handler);
  app.get("/status/:by/:value", ...statusRoute.validators, statusRoute.handler);

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

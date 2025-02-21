import { type Hono } from "../deps.ts";
import { type ContextVariableEnvMap } from "../types.ts";

import * as db from "./database.ts";

export async function registerMiddleware(app: Hono) {
  // other env
  const envToVar: Record<keyof ContextVariableEnvMap, string | number> = {
    privateUrl: Deno.env.get("PRIVATE_URL")!,
    generateApiUrl: Deno.env.get("GENERATE_API_URL")!,
    varDir: Deno.env.get("VAR_DIR")!,
    rtmpApiUrl: Deno.env.get("RTMP_API_URL")!,
    rtmpStreamPort: Deno.env.get("RTMP_STREAM_PORT")!,
    rtmpUdpRange: Deno.env.get("RTMP_UDP_RANGE")!,
    rtmpHostname: Deno.env.get("RTMP_HOSTNAME")!,
    databasePath: Deno.env.get("DATABASE_PATH") ?? ":memory:",
  };

  const connection = await db.connect(String(envToVar.databasePath));

  app.use(async (c, next) => {
    Object.entries(envToVar).forEach(([name, value]) => {
      c.set(name as keyof ContextVariableEnvMap, String(value));
    });

    c.set("db", connection);

    await next();
  });
}

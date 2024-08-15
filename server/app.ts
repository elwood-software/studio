import { assert, Hono } from "./_deps.ts";
import { HandlerContextVariables } from "./types.ts";
import { connectDatabase } from "./lib/connect-database.ts";
import { registerMiddleware } from "./middleware.ts";
import { registerRoutes } from "./routes.ts";

// deno-lint-ignore require-await
export async function createApp() {
  const app = new Hono<{ Variables: HandlerContextVariables }>();
  const secret = Deno.env.get("JWT_SECRET");
  const dbUrl = Deno.env.get("DB_URL");
  const syncBucketNames = Deno.env.get("SYNC_SUPABASE_BUCKET_NAME");
  const processWebhooksOnReceive = Deno.env.get("PROCESS_WEBHOOKS_ON_RECEIVE");

  assert(dbUrl, "missing DB_URL");
  assert(secret, "missing JWT_SECRET");

  const db = connectDatabase(dbUrl);

  registerMiddleware(app, {
    db,
    jwtSecret: secret,
    settings: {
      processWebhooksOnReceive: processWebhooksOnReceive === "true" ||
        processWebhooksOnReceive === "1",
      syncSupabaseBucketNames: syncBucketNames
        ? syncBucketNames.split(",")
        : [],
    },
  });
  registerRoutes(app);

  return app;
}

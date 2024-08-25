import { _, assert, Hono } from "./_deps.ts";
import { HandlerContextVariables } from "./types.ts";
import { registerMiddleware } from "./middleware.ts";
import { registerRoutes } from "./routes.ts";

// deno-lint-ignore require-await
export async function createApp() {
  const app = new Hono<{ Variables: HandlerContextVariables }>();
  const secret = Deno.env.get("JWT_SECRET");
  const dbUrl = Deno.env.get("DB_URL");
  const syncBucketNames = Deno.env.get("SYNC_SUPABASE_BUCKET_NAME");
  const processWebhooksOnReceive = Deno.env.get("PROCESS_WEBHOOKS_ON_RECEIVE");
  const platformApiUrl = Deno.env.get("PLATFORM_API_URL");
  const instanceId = Deno.env.get("INSTANCE_ID");

  assert(dbUrl, "missing DB_URL");
  assert(secret, "missing JWT_SECRET");

  // if a platform api url is set, you can not set a default instance
  assert(
    !(!!platformApiUrl && !!instanceId),
    "You can not set both PLATFORM_API_URL and INSTANCE_ID",
  );

  registerMiddleware(app, {
    dbUrl,
    jwtSecret: secret,
    platformApiUrl,
    instanceId,
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

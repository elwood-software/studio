import { assert, Hono, honoJwt, type Next, zValidator } from "./_deps.ts";
import { HandlerContextVariables } from "./types.ts";
import { connectDatabase } from "./lib/connect-database.ts";
import { isRole } from "./lib/is-role.ts";
import { createStripe } from "./lib/stripe.ts";

import * as feedHandler from "./handler/feed.ts";
import * as createSubscribeHandler from "./handler/subscription/create.ts";
import * as createCustomerHandler from "./handler/customer/create.ts";

// deno-lint-ignore require-await
export async function createApp() {
  const app = new Hono<{ Variables: HandlerContextVariables }>();
  const secret = Deno.env.get("JWT_SECRET");
  const db = connectDatabase();
  const stripe = createStripe();

  assert(secret, "missing JWT_SECRET");

  app.use(async (c, next: Next) => {
    c.set("db", db);
    c.set("stripe", stripe);
    await next();
  });

  /**
   * Not found & Error
   */
  app.notFound((c) =>
    c.json({ success: false, error: { name: "not_found" } }, 404)
  );
  app.onError((err, c) => {
    const status = (err as Error & { status: number }).status ?? 500;

    console.log(err.message, err.stack);

    return c.json(
      {
        success: false,
        error: { name: "internal_error", message: (err as Error).message },
      },
      // deno-lint-ignore no-explicit-any
      status as any,
    );
  });

  app.get("/status", (c) => c.json({ success: true }));

  app.get(
    "/feed/:id",
    zValidator("param", feedHandler.schema),
    feedHandler.handler,
  );

  const authApp = new Hono<{ Variables: HandlerContextVariables }>();

  // JWT middleware
  authApp.use(
    "/*",
    honoJwt({
      secret,
    }),
  );

  // must have at least authenticated role
  // can also have service_role
  authApp.use("/*", isRole(["service_role", "authenticated"]));

  authApp.post(
    "/customer",
    zValidator("json", createCustomerHandler.schema),
    createCustomerHandler.handler,
  );

  authApp.post(
    "/subscription",
    zValidator("json", createSubscribeHandler.schema),
    createSubscribeHandler.handler,
  );

  // add auth routes
  app.route("/", authApp);

  return app;
}

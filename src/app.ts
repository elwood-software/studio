import { assert, Hono, honoJwt, type Next, z, zValidator } from "@/_deps.ts";
import { HandlerContextVariables } from "@/types.ts";
import { connectDatabase } from "@/lib/connect-database.ts";
import { isAuthenticated, isRole } from "@/lib/is-role.ts";
import { createStripe } from "@/lib/stripe.ts";
import * as orm from "./lib/orm.ts";
import { Roles } from "@/constants.ts";

import * as viewFeedHandler from "@/handler/feed/view.ts";
import * as createSubscribeHandler from "@/handler/subscription/create.ts";
import * as createCustomerHandler from "@/handler/customer/create.ts";
import * as updateSubscriptionFeedsHandler from "@/handler/subscription/update-feeds.ts";
import * as afterCustomerHandler from "@/handler/customer/after.ts";
import * as inboundWebhookHandler from "@/handler/webhook/inbound.ts";
import * as processWebhookHandler from "@/handler/webhook/process.ts";

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
    c.set("orm", orm.provider(db));
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

    console.log("ERROR", err.message, err.stack);

    return c.json(
      {
        success: false,
        error: { name: "internal_error", message: (err as Error).message },
      },
      // deno-lint-ignore no-explicit-any
      status as any,
    );
  });

  // check the jwt only if one is provided
  // the isRole middleware will check if the user has the correct role
  app.use(
    "/*",
    async (ctx, next: Next) => {
      if (ctx.req.header("authorization")) {
        return await honoJwt({
          secret,
        })(ctx, next);
      }

      return await next();
    },
  );

  //
  // UNAUTHENTICATED
  //

  app.get("/status", (c) => c.json({ success: true }));

  app.get(
    "/feed/:id",
    zValidator("param", viewFeedHandler.schema),
    viewFeedHandler.handler,
  );

  app.post(
    "/customer",
    zValidator("json", createCustomerHandler.schema),
    createCustomerHandler.handler,
  );

  app.get(
    "/customer/after",
    afterCustomerHandler.handler,
  );

  app.post(
    "/webhook/:source",
    zValidator("param", inboundWebhookHandler.schema),
    inboundWebhookHandler.handler,
  );

  //
  // AUTHENTICATED
  //

  app.post(
    "/subscription",
    isAuthenticated(),
    zValidator("json", createSubscribeHandler.schema),
    createSubscribeHandler.handler,
  );

  app.get(
    "/subscription/:id/feeds",
    isAuthenticated(),
    zValidator("param", updateSubscriptionFeedsHandler.schema),
    updateSubscriptionFeedsHandler.handler,
  );

  app.post(
    "/subscription/:id/feeds",
    isAuthenticated(),
    zValidator("param", updateSubscriptionFeedsHandler.schema),
    updateSubscriptionFeedsHandler.handler,
  );

  app.get(
    "/subscription/:id/feeds",
    isAuthenticated(),
    zValidator("json", updateSubscriptionFeedsHandler.schema),
    updateSubscriptionFeedsHandler.handler,
  );

  app.post(
    "/webhook/:id/process",
    isRole(Roles.ServiceRole),
    zValidator("param", processWebhookHandler.schema),
    zValidator("json", processWebhookHandler.bodySchema),
    processWebhookHandler.handler,
  );

  return app;
}

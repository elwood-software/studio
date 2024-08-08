import { assert, cors, Hono, honoJwt, type Next, zValidator } from "@/_deps.ts";
import { HandlerContextVariables } from "@/types.ts";
import { connectDatabase } from "@/lib/connect-database.ts";
import { isAuthenticated, isRole } from "@/lib/is-role.ts";
import { createStripe, getStripeAccountId } from "@/lib/stripe.ts";
import * as orm from "@/lib/orm.ts";
import { Roles } from "@/constants.ts";
import { instanceMiddleware } from "@/lib/instance-id.ts";

import * as viewFeedHandler from "@/handler/feed/view.ts";
import * as createSubscribeHandler from "@/handler/subscription/create.ts";
import * as createCustomerHandler from "@/handler/customer/create.ts";
import * as updateSubscriptionEntitlementsHandler from "@/handler/subscription/update-entitlements.ts";
import * as listSubscriptionEntitlementsHandler from "@/handler/subscription/list-entitlements.ts";
import * as afterCustomerHandler from "@/handler/customer/after.ts";
import * as inboundWebhookHandler from "@/handler/webhook/inbound.ts";
import * as processWebhookHandler from "@/handler/webhook/process.ts";
import * as planListHandler from "@/handler/plan/list.ts";
import * as listSubscriptionsHandler from "@/handler/subscription/list.ts";
import * as viewSiteHandler from "@/handler/site/view.ts";

// deno-lint-ignore require-await
export async function createApp() {
  const app = new Hono<{ Variables: HandlerContextVariables }>();
  const secret = Deno.env.get("JWT_SECRET");
  const db = connectDatabase();

  assert(secret, "missing JWT_SECRET");

  app.use(instanceMiddleware);
  app.use(cors());
  app.use(
    async (ctx, next: Next) => {
      if (ctx.req.header("authorization")) {
        return await honoJwt({
          secret,
        })(ctx, next);
      }

      return await next();
    },
    async (c, next: Next) => {
      const userId = c.get("jwtPayload")?.sub;

      c.set("db", db);
      c.set(
        "stripe",
        createStripe(undefined, await getStripeAccountId(c.get("instanceId"))),
      );
      c.set("orm", orm.provider(db));
      c.set("userId", userId);

      // if there's a user id
      // we need to map it to a customer
      if (userId) {
        c.set(
          "customer",
          await db.elwood.query.selectFrom("studio_customer")
            .selectAll()
            .where("user_id", "=", userId)
            .where("instance_id", "=", c.get("instanceId"))
            .executeTakeFirst(),
        );
      }
      await next();
    },
  );

  //
  // UNAUTHENTICATED
  //

  app.get("/status", (c) => c.json({ success: true }));

  app.get(
    "/site",
    zValidator("header", viewSiteHandler.schema),
    viewSiteHandler.handler,
  );

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

  app.get(
    "/plan",
    planListHandler.handler,
  );

  //
  // AUTHENTICATED
  //

  app.get(
    "/subscription",
    isAuthenticated(),
    zValidator("query", listSubscriptionsHandler.schema),
    listSubscriptionsHandler.handler,
  );

  app.post(
    "/subscription",
    isAuthenticated(),
    zValidator("json", createSubscribeHandler.schema),
    createSubscribeHandler.handler,
  );

  app.get(
    "/subscription/:id/entitlements",
    isAuthenticated(),
    zValidator("param", listSubscriptionEntitlementsHandler.schema),
    listSubscriptionEntitlementsHandler.handler,
  );

  app.post(
    "/subscription/:id/entitlements",
    isAuthenticated(),
    zValidator("param", updateSubscriptionEntitlementsHandler.schema),
    updateSubscriptionEntitlementsHandler.handler,
  );

  app.post(
    "/webhook/:id/process",
    isRole(Roles.ServiceRole),
    zValidator("param", processWebhookHandler.schema),
    zValidator("json", processWebhookHandler.bodySchema),
    processWebhookHandler.handler,
  );

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

  return app;
}

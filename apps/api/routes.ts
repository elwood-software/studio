import { Hono, z, zValidator } from "./_deps.ts";
import type { HandlerContextVariables } from "./types.ts";
import { isAuthenticated, isRole } from "./lib/is-role.ts";
import { Roles } from "./constants.ts";

import * as viewFeedHandler from "./handler/feed/view.ts";
import * as createSubscribeHandler from "./handler/subscription/create.ts";
import * as createCustomerHandler from "./handler/customer/create.ts";
import * as updateSubscriptionEntitlementsHandler from "./handler/subscription/update-entitlements.ts";
import * as listSubscriptionEntitlementsHandler from "./handler/subscription/list-entitlements.ts";
import * as afterCustomerHandler from "./handler/customer/after.ts";
import * as inboundWebhookHandler from "./handler/webhook/inbound.ts";
import * as processWebhookHandler from "./handler/webhook/process.ts";
import * as planListHandler from "./handler/plan/list.ts";
import * as listSubscriptionsHandler from "./handler/subscription/list.ts";
import * as viewSiteHandler from "./handler/site/view.ts";
import * as listEpisodesHandler from "./handler/episode/list.ts";
import * as viewEpisodeHandler from "./handler/episode/view.ts";
import * as nodePlayHandler from "./handler/play/node.ts";
import * as viewShowFeedHandler from "./handler/show/episodes.ts";
import * as viewShowHandler from "./handler/show/view.ts";
import * as checkSubscriptionHandler from "./handler/subscription/check.ts";

export function registerRoutes(
  app: Hono<{ Variables: HandlerContextVariables }>,
) {
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
    "/episode",
    zValidator("query", listEpisodesHandler.schema),
    listEpisodesHandler.handler,
  );

  app.get(
    "/episode/:id",
    zValidator("param", viewEpisodeHandler.schema),
    viewEpisodeHandler.handler,
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

  app.get(
    "/play/:id",
    zValidator("param", nodePlayHandler.schema),
    nodePlayHandler.handler,
  );

  app.get(
    "/show/:id",
    zValidator("param", viewShowHandler.schema),
    viewShowHandler.handler,
  );

  app.get(
    "/show/:id/episodes",
    zValidator("param", viewShowFeedHandler.schema),
    zValidator("query", viewShowFeedHandler.querySchema),
    viewShowFeedHandler.handler,
  );

  //
  // AUTHENTICATED
  //

  app.post(
    "/subscription/check",
    isAuthenticated(),
    zValidator("json", checkSubscriptionHandler.schema),
    checkSubscriptionHandler.handler,
  );

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
}

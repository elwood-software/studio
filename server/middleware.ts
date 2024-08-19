import { cors, Hono, honoJwt, type Next } from "./_deps.ts";
import type { HandlerContextVariables, Settings } from "./types.ts";

import { createStripe, getStripeAccountId } from "./lib/stripe.ts";
import * as orm from "./lib/orm.ts";
import { instanceMiddleware } from "./lib/instance-id.ts";
import { connectDatabase } from "./lib/connect-database.ts";

export type MiddlewareOptions = {
  dbUrl: string;
  jwtSecret: string;
  settings: Settings;
  platformApiUrl?: string;
  instanceId?: string;
};

export function registerMiddleware(
  app: Hono<{ Variables: HandlerContextVariables }>,
  options: MiddlewareOptions,
) {
  const { dbUrl, jwtSecret } = options;

  app.use(instanceMiddleware(options.instanceId, options.platformApiUrl));
  app.use(cors());
  app.use(
    async (ctx, next: Next) => {
      if (ctx.req.header("authorization")) {
        return await honoJwt({
          secret: jwtSecret,
        })(ctx, next);
      }

      return await next();
    },
    async (c, next: Next) => {
      const userId = c.get("jwtPayload")?.sub;
      const db = connectDatabase(dbUrl);

      c.set("db", db);
      c.set(
        "stripe",
        createStripe(undefined, await getStripeAccountId(c.get("instanceId"))),
      );
      c.set("orm", orm.provider(db));
      c.set("userId", userId);
      c.set("settings", options.settings);

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

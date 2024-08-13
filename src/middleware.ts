import { cors, Hono, honoJwt, type Next } from "@/_deps.ts";
import type {
  ConnectDatabaseResult,
  HandlerContextVariables,
  Settings,
} from "@/types.ts";

import { createStripe, getStripeAccountId } from "@/lib/stripe.ts";
import * as orm from "@/lib/orm.ts";
import { instanceMiddleware } from "@/lib/instance-id.ts";

export type MiddlewareOptions = {
  db: ConnectDatabaseResult;
  jwtSecret: string;
  settings: Settings;
};

export function registerMiddleware(
  app: Hono<{ Variables: HandlerContextVariables }>,
  options: MiddlewareOptions,
) {
  const { db, jwtSecret } = options;

  app.use(instanceMiddleware);
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

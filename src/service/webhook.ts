import type {
  HandlerContextVariables,
  JsonObject,
  StudioWebhook,
} from "@/types.ts";
import { _, DBConstant } from "@/_deps.ts";
import { subscription } from "@/service/mod.ts";

export async function processRow(
  ctx: HandlerContextVariables,
  row: StudioWebhook,
): Promise<string[]> {
  switch (row.source) {
    case "stripe":
      return await processStripe(ctx, row.payload as { body: JsonObject });
    default: {
      return ["unknown source", row.source];
    }
  }
}

export async function processStripe(
  ctx: HandlerContextVariables,
  payload: { body: JsonObject },
): Promise<string[]> {
  const obj = _.get(payload.body, ["data", "object"]);
  const objectType = _.get(obj, "object");
  const log: string[] = [];

  switch (objectType) {
    case "subscription": {
      const status = _.get(obj, "status") as
        | "incomplete"
        | "incomplete_expired"
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "unpaid"
        | "paused";

      const metadata = _.get(obj, "metadata") as {
        "node_id": string;
        "plan_id": string;
        "price_id": string;
        "customer_id": string;
        "subscription_id": string | null;
      };

      log.push("stripe subscription id", obj.id);
      log.push("subscription status", status);

      switch (status) {
        case "active": {
          let subscription_id = metadata.subscription_id;

          if (!subscription_id) {
            const result = await subscription.create(ctx, {
              node_id: metadata.node_id,
              plan_id: metadata.plan_id,
              price_id: metadata.price_id,
              customer_id: metadata.customer_id,
              stripe_subscription_id: obj.id,
            });
            subscription_id = result.subscription.id;
          }

          // update the subscription with the stripe subscription id
          // and active it
          await ctx.db.elwood.query.updateTable("studio_subscription")
            .set({
              status: DBConstant.StudioSubscriptionStatuses.Active,
              metadata: {
                stripe_id: obj.id,
              },
            })
            .where("id", "=", subscription_id)
            .execute();

          // tell them what's up
          log.push("subscription created");
        }
      }
      break;
    }
    default: {
      log.push("unknown object type", objectType);
    }
  }

  return await Promise.resolve(log);
}

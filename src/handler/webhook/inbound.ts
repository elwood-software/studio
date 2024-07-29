import type { HandlerContext, JsonObject } from "@/types.ts";
import { assert, DBConstant, z } from "@/_deps.ts";
import { getStripeWebhookSecret } from "@/lib/stripe.ts";
import { webhook } from "@/service/mod.ts";

export const schema = z.object({
  source: z.enum(["stripe"]),
});

type Schema = z.infer<typeof schema>;

export async function handler(
  ctx: HandlerContext,
) {
  const { source } = ctx.req.param() as Schema;
  const rawBody = await ctx.req.text();
  const processOnReceive =
    Deno.env.get("PROCESS_WEBHOOKS_ON_RECEIVE") === "true";
  let reference_id: string = crypto.randomUUID();
  let body = JSON.parse(rawBody);
  let created_at = new Date();

  // throw away any errors
  try {
    switch (source) {
      case "stripe": {
        const secret = getStripeWebhookSecret();

        const evt = await ctx.var.stripe.webhooks.constructEventAsync(
          rawBody as string,
          ctx.req.header("Stripe-Signature") ?? "",
          secret,
        );

        assert(evt, "Failed to construct event");

        body = evt;
        reference_id = evt.request?.idempotency_key ?? reference_id;

        // queue it from the event creation data
        // not the order the even was received
        created_at = new Date(evt.created * 1000);

        break;
      }
      default:
        // do nothing
    }

    // always add the webhook to the db
    // so we have something trackable
    await ctx.var.db.elwood.query.insertInto("studio_webhook")
      .values({
        is_processed: processOnReceive,
        direction: DBConstant.StudioWebhookDirections.Inbound,
        source,
        payload: { body },
        reference_id,
        created_at,
      }).execute();

    // in dev we want to process requests when they're received
    if (processOnReceive) {
      await webhook.processRow(ctx.var, {
        id: crypto.randomUUID(),
        is_processed: false,
        direction: DBConstant.StudioWebhookDirections.Inbound,
        source,
        payload: { body },
        reference_id,
        created_at: new Date(),
      });
    }
  } catch (err) {
    console.log(err.message, "error importing webhook");
  }

  return ctx.json({});
}

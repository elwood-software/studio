import type { HandlerContext, SupabaseWebhookPayload } from "@api/types.ts";
import { assert, DBConstant, z } from "@api/_deps.ts";
import { getStripeWebhookSecret } from "@api/lib/stripe.ts";
import { webhook } from "@api/service/mod.ts";
import { canProcessFile } from "@api/service/webhook/supabase.ts";

export const schema = z.object({
  source: z.enum(["stripe", "supabase-storage-sync"]),
});

type Schema = z.infer<typeof schema>;

export async function handler(
  ctx: HandlerContext,
) {
  const { processWebhooksOnReceive, syncSupabaseBucketNames } = ctx.get(
    "settings",
  );

  console.log("inbound webhook");

  const { source } = ctx.req.param() as Schema;
  const rawBody = await ctx.req.text();
  const rawHeaders = Object.create(ctx.req.raw.headers) as Record<
    string,
    string
  >;

  const headers = rawHeaders;
  let reference_id: string = crypto.randomUUID();
  let body = JSON.parse(rawBody);
  let created_at = new Date();

  // throw away any errors
  try {
    switch (source) {
      // SUPABASE
      case "supabase-storage-sync": {
        if (!["INSERT", "UPDATE", "DELETE"].includes(body.type)) {
          throw new Error("Invalid type");
        }

        // make sure its a bucket we're interested in
        const body_ = body as SupabaseWebhookPayload.Any<
          SupabaseWebhookPayload.StorageObjectTableRecord
        >;
        const record = body_.type === "DELETE"
          ? body_.old_record
          : body_.record;

        if (
          !record?.bucket_id ||
          record?.bucket_id &&
            !syncSupabaseBucketNames.includes(record.bucket_id)
        ) {
          throw new Error("Invalid bucket");
        }

        if (canProcessFile(record.name) === false) {
          throw new Error("Invalid file");
        }

        // otherwise keep going
        break;
      }

      // STRIPE
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
        throw new Error(`Unsupported source: ${source}`);
    }

    const payload = { body, headers };

    // always add the webhook to the db
    // so we have something trackable
    await ctx.var.db.elwood.query.insertInto("studio_webhook")
      .values({
        is_processed: processWebhooksOnReceive,
        direction: DBConstant.StudioWebhookDirections.Inbound,
        source,
        payload,
        reference_id,
        created_at,
      }).execute();

    // in dev we want to process requests when they're received
    if (processWebhooksOnReceive) {
      await webhook.processRow(ctx.var, {
        id: crypto.randomUUID(),
        is_processed: false,
        direction: DBConstant.StudioWebhookDirections.Inbound,
        source,
        payload,
        reference_id,
        created_at: new Date(),
      });
    }
  } catch (err) {
    console.log("error importing webhook");
    console.log(err.message);
    console.log(err.stack);
  }

  return ctx.json({});
}

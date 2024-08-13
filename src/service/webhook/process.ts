import type {
  HandlerContextVariables,
  JsonObject,
  StudioWebhook,
  SupabaseWebhookPayload,
} from "@/types.ts";

import { processSupabaseStorageSync } from "@/service/webhook/supabase.ts";
import { processStripe } from "@/service/webhook/stripe.ts";

export async function processRow(
  ctx: HandlerContextVariables,
  row: StudioWebhook,
): Promise<string[]> {
  switch (row.source) {
    case "supabase-storage-sync":
      return await processSupabaseStorageSync(
        ctx,
        row.payload as {
          body: SupabaseWebhookPayload.Any<
            SupabaseWebhookPayload.StorageObjectTableRecord
          >;
        },
      );

    case "stripe":
      return await processStripe(ctx, row.payload as { body: JsonObject });
    default: {
      return ["unknown source", row.source];
    }
  }
}

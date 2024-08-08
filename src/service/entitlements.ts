import { jwt, sql, xml } from "@/_deps.ts";
import type {
  HandlerContextVariables,
  JsonObject,
  Node,
  StudioContent,
  StudioNode,
} from "@/types.ts";
import * as feed from "@/service/feed.ts";

export type ListForSubscriptionInput = {
  subscription_id: string;
};

export type ListForSubscriptionResult = {
  entitled_node_ids: string[];
  customer_node_ids: string[];
};

/**
 * list the feeds that a subscription entitles a customer to
 * @param ctx
 * @param input
 * @returns
 */
export async function listForSubscription(
  ctx: HandlerContextVariables,
  input: ListForSubscriptionInput,
): Promise<ListForSubscriptionResult> {
  const db = ctx.db.elwood;

  const subscription = await db.query.selectFrom("studio_subscription")
    .selectAll()
    .where("id", "=", input.subscription_id)
    .executeTakeFirstOrThrow();

  const nodes = await ctx.db.elwood.query.selectFrom("studio_node")
    .selectAll()
    .where(
      "id",
      "=",
      subscription.node_id,
    )
    .execute();

  const entitled_node_ids: string[] = [];

  for (const node of nodes) {
    switch (node.category) {
      case "FEED":
      case "SHOW": {
        entitled_node_ids.push(node.id);
        break;
      }
      case "NETWORK": {
        // get all private feeds for this network
        const shows = await ctx.db.elwood.query
          .selectFrom("studio_node")
          .selectAll()
          .where(
            "parent_id",
            "=",
            node.id,
          ).execute();

        for (const show of shows) {
          const privateFeed = await ctx.db.elwood.query
            .selectFrom("studio_node")
            .selectAll()
            .where("parent_id", "=", show.id)
            .where(
              "category",
              "=",
              "FEED",
            )
            .where(
              "sub_category",
              "=",
              "PRIVATE",
            )
            .executeTakeFirst();

          if (privateFeed) {
            entitled_node_ids.push(privateFeed.id);
          }
        }

        entitled_node_ids.push(node.id);
        break;
      }
      default: {
        continue;
      }
    }
  }

  const customer_node_ids: string[] = [];

  // not get all of the customer_node_ids that relate to the entitilement
  for (const node_id of entitled_node_ids) {
    const node = await ctx.orm.maybeStudioNode((q) =>
      q
        .where("parent_id", "=", node_id)
        .where(
          ({ eb, ref }) =>
            eb(
              ref("metadata", "->>").key("subscription_id" as unknown as never),
              "=",
              input.subscription_id,
            ),
        )
    );

    // what type of node is this
    if (node) {
      switch (node.category) {
        case "FEED": {
          customer_node_ids.push(node.id);
        }
      }
    }
  }

  return {
    entitled_node_ids,
    customer_node_ids,
  };
}

export type UpdateForSubscriptionInput = {
  subscription_id: string;
};

export async function updateForSubscription(
  ctx: HandlerContextVariables,
  input: UpdateForSubscriptionInput,
): Promise<void> {
  const { entitled_node_ids, customer_node_ids } = await listForSubscription(
    ctx,
    input,
  );

  for (const node_id of entitled_node_ids) {
    if (customer_node_ids.includes(node_id)) {
      continue;
    }

    await feed.create(ctx, {
      node_id,
      subscription_id: input.subscription_id,
    });
  }
}

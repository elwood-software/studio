import { assert, DBConstant } from "@/_deps.ts";
import type {
  HandlerContextVariables,
  Node,
  StudioCustomer,
  StudioSubscription,
} from "@/types.ts";
import { getStripeAccountId } from "@/lib/stripe.ts";

export type CreateInput =
  & {
    node_id: string;
    plan_id: string;
    price_id: string;
    stripe_subscription_id?: string;
  }
  & (
    | { user_id: string; customer_id?: never }
    | { user_id?: never; customer_id: string }
  );

export type CreateResult = {
  outcome: "created" | "exists";
  subscription: StudioSubscription;
  node: Node;
  customer: StudioCustomer;
};

export async function create(
  ctx: HandlerContextVariables,
  input: CreateInput,
): Promise<CreateResult> {
  const stripe = ctx.stripe;
  const db = ctx.db.elwood;
  const { node_id, plan_id, user_id, customer_id } = input;

  // do the subscription in a transaction
  // to make sure we roll back if anything fails
  return await db.connection.transaction().execute(
    async (tx_) => {
      const tx = tx_.withSchema("elwood");

      // get the raw node so we can look up the instance id
      // which doesn't exist in the public node
      const node = await tx.selectFrom("node")
        .selectAll()
        .where(
          "id",
          "=",
          node_id,
        )
        .executeTakeFirstOrThrow();

      const stripe_account_id = await getStripeAccountId(node.instance_id);

      assert("stripe_account_id", "Stripe account not found");

      const plan = await tx.selectFrom("studio_plan")
        .selectAll()
        .where(
          "id",
          "=",
          plan_id,
        )
        .executeTakeFirstOrThrow();

      // price
      const price = plan.prices?.find((item) => item.id === input.price_id);

      assert(price, "Price not found");
      assert(price.stripe_id, "Price does not have a stripe id");

      // get the customer
      const customer = await tx.selectFrom("studio_customer").selectAll()
        .$if(!!customer_id, (q) => q.where("id", "=", customer_id!))
        .$if(!!user_id, (q) => q.where("user_id", "=", user_id!))
        .executeTakeFirstOrThrow();

      // check if the customer has an active subscription to this node
      const currentSubscription = await tx.selectFrom(
        "studio_subscription",
      ).selectAll().where(
        "status",
        "=",
        "ACTIVE",
      )
        .where("customer_id", "=", customer.id).executeTakeFirst();

      if (currentSubscription) {
        return {
          outcome: "exists",
          subscription: currentSubscription,
          customer,
          node,
        } as CreateResult;
      }

      const stripeCustomerId = customer.metadata?.stripe_id;

      if (!stripeCustomerId) {
        throw new Error("You need to have a stripe customer id");
      }

      // create a new subscription
      let subscription = await tx.insertInto("studio_subscription")
        .values({
          instance_id: node.instance_id,
          customer_id: customer.id,
          node_id: node.id,
          plan_id: plan.id,
          status: DBConstant.StudioSubscriptionStatuses.Pending,
          metadata: {
            price_id: price.id,
            stripe_price_id: price.stripe_id,
            stripe_id: input.stripe_subscription_id ?? null,
            stripe_account_id,
          },
        }).returning("id").executeTakeFirstOrThrow();

      // if the subscription id is not provided
      // it means we need to create one now
      if (!input.stripe_subscription_id) {
        // now create a subscription in stripe
        const stripeSubscription = await stripe.subscriptions.create({
          customer: stripeCustomerId,
          items: [
            {
              price: price.stripe_id,
            },
          ],
          metadata: {
            node_id: node.id,
            plan_id: plan.id,
            price_id: price.id,
            customer_id: customer.id,
            subscription_id: subscription.id,
          },
          expand: ["latest_invoice.payment_intent"],
        }, { stripeAccount: stripe_account_id });

        // update the new subscription
        subscription = await tx.updateTable("studio_subscription")
          .set({
            status: DBConstant.StudioPlanStatuses.Active,
            metadata: {
              stripe_id: stripeSubscription.id,
            },
          })
          .where("id", "=", subscription.id)
          .returningAll()
          .executeTakeFirstOrThrow();
      }

      return {
        outcome: "created",
        subscription,
        customer,
        node,
      } as CreateResult;
    },
  );
}

export type VerifyInput = {
  feedId: string;
  subscriptionId?: never;
} | {
  feedId?: never;
  subscriptionId: string;
};

export async function verify(
  ctx: HandlerContextVariables,
  input: VerifyInput,
): Promise<void> {
  let subscriptionId_ = input.subscriptionId;

  if (input.feedId) {
    const feed = await ctx.db.elwood.query.selectFrom("node")
      .where(
        "id",
        "=",
        input.feedId,
      )
      .select("metadata")
      .executeTakeFirstOrThrow();

    subscriptionId_ = feed.metadata?.subscription_id;
  }

  if (!subscriptionId_) {
    throw new Error("Subscription is not valid");
  }

  // make sure the subscription is active
  await ctx.db.elwood.query.selectFrom("studio_subscription")
    .select("id")
    .where("id", "=", subscriptionId_)
    .where("status", "=", DBConstant.StudioPlanStatuses.Active)
    .executeTakeFirstOrThrow();
}

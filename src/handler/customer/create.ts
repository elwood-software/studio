import type { HandlerContext } from "@/types.ts";
import { assert, DBConstant, z } from "@/_deps.ts";
import { getStripeAccountId } from "@/lib/stripe.ts";
import { customer } from "@/service/mod.ts";

export const schema = z.object({
  node_id: z.string().uuid(),
  plan_id: z.string().uuid(),
  price_id: z.string().uuid(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  mode: z.enum(["setup", "subscription"]).default("setup").optional(),
});

type Schema = z.infer<typeof schema>;

export async function handler(
  ctx: HandlerContext,
): Promise<Response> {
  const stripe = ctx.get("stripe");
  const db = ctx.get("db");

  const { first_name, last_name, plan_id, price_id, mode, node_id, email } =
    (await ctx.req.json()) as Schema;

  // make sure the node is active and published
  const node = await db.public.query.selectFrom("elwood_studio_node")
    .select("id")
    .where(
      "id",
      "=",
      node_id,
    )
    .executeTakeFirstOrThrow();

  // get the plan and make sure it is active
  const plan = await db.elwood.query.selectFrom("studio_plan")
    .selectAll()
    .where("id", "=", plan_id)
    .where("status", "=", DBConstant.StudioPlanStatuses.Active)
    .executeTakeFirstOrThrow();

  // make sure this plan is available to this node
  const _planNode = await db.elwood.query.selectFrom("studio_node_plan")
    .select("id")
    .where("node_id", "=", node.id)
    .where("plan_id", "=", plan.id)
    .executeTakeFirstOrThrow();

  // make sure the price is available to this plan
  const price = (plan.prices ?? []).find((item) => item.id === price_id);

  assert(price, "Price not found");

  // create a new customer and stripe customer
  const result = await customer.create(ctx.var, {
    instanceId: plan.instance_id,
    email,
    firstName: first_name,
    lastName: last_name,
  });

  const stripeAccountId = await getStripeAccountId(plan.instance_id);
  const return_url = new URL("/customer/after?result=return", ctx.req.url)
    .toString();
  const success_url = new URL("/customer/after?result=success", ctx.req.url)
    .toString();
  const cancel_url = new URL("/customer/after?result=cancel", ctx.req.url)
    .toString();

  if (mode === "subscription") {
    // create a checkout session to setup a default payment method
    // for this customer
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      ui_mode: "hosted",
      success_url,
      cancel_url,
      customer: result.stripeCustomerId,
      subscription_data: {
        metadata: {
          node_id: node.id,
          plan_id: plan.id,
          price_id: price.id,
          customer_id: result.customer.id,
        },
      },
      metadata: {
        customer_id: result.customer.id,
      },
      line_items: [
        {
          price: price.stripe_id,
          quantity: 1,
        },
      ],
    }, { stripeAccount: stripeAccountId });

    return ctx.json({
      id: result.customer.id,
      url: checkoutSession.url,
    });
  }

  // create a checkout session to setup a default payment method
  // for this customer
  const checkoutSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "setup",
    ui_mode: "embedded",
    return_url,
    customer: result.stripeCustomerId,
    metadata: {
      customer_id: result.customer.id,
    },
  }, { stripeAccount: stripeAccountId });

  return ctx.json({
    id: result.customer.id,
    checkout_secret: checkoutSession.client_secret,
  });
}

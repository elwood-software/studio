import type { HandlerContext } from "@/types.ts";
import { assert, DBConstant, z } from "@/_deps.ts";
import { getStripeAccountId } from "@/lib/stripe.ts";
import { customer } from "@/service/mod.ts";
import { createQueryNotFoundError } from "@/lib/errors.ts";
import { createServiceSupabaseClient } from "@/lib/supabase.ts";

export const schema = z.object({
  plan_id: z.string().uuid(),
  price_id: z.string().uuid(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email().optional(),
  mode: z.enum(["setup", "subscription"]).default("setup").optional(),
  return_url: z.string().url().optional(),
  success_url: z.string().url().optional(),
});

export const noUserSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
});

type Schema = z.infer<typeof schema>;

export async function handler(
  ctx: HandlerContext,
): Promise<Response> {
  const stripe = ctx.get("stripe");
  const db = ctx.get("db");
  const serviceClient = createServiceSupabaseClient();
  const sub = ctx.get("userId");

  const {
    first_name,
    last_name,
    plan_id,
    price_id,
    mode,
    email,
    return_url,
    success_url,
  } = (await ctx.req.json()) as Schema;

  // if no user is given, we need to parse the data
  // tio make syre we have the required fields
  // for creating a customer
  if (!sub) {
    noUserSchema.parse({ first_name, last_name, email });
  }

  // get the plan and make sure it is active
  const plan = await db.elwood.query.selectFrom("studio_plan")
    .selectAll()
    .where("id", "=", plan_id)
    .where("status", "=", DBConstant.StudioPlanStatuses.Active)
    .executeTakeFirstOrThrow(createQueryNotFoundError("Plan not found"));

  // make sure the price is available to this plan
  const price = (plan.prices ?? []).find((item) => item.id === price_id);

  assert(price, "Price not found");

  // create a new customer and stripe customer
  const result = await customer.create(ctx.var, {
    instanceId: plan.instance_id,
    userId: sub,
    email,
    firstName: first_name,
    lastName: last_name,
  });

  const stripeAccountId = await getStripeAccountId(plan.instance_id);

  if (mode === "subscription") {
    // we need a magic link to login the user
    const { data } = await serviceClient.auth.admin.generateLink({
      type: "magiclink",
      email: result.customer.email,
    });

    // create a checkout session to setup a default payment method
    // for this customer
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      ui_mode: "hosted",
      success_url,
      cancel_url: return_url,
      customer: result.stripeCustomerId,
      subscription_data: {
        metadata: {
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
      auth_link: data.properties?.action_link,
      checkout_url: checkoutSession.url,
      checkout_session_id: checkoutSession.id,
    });
  }

  // create a checkout session to setup a default payment method
  // for this customer
  const checkoutSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "setup",
    ui_mode: "embedded",
    return_url,
    success_url,
    customer: result.stripeCustomerId,
    metadata: {
      customer_id: result.customer.id,
    },
  }, { stripeAccount: stripeAccountId });

  return ctx.json({
    id: result.customer.id,
    checkout_secret: checkoutSession.client_secret,
    checkout_session_id: checkoutSession.id,
  });
}

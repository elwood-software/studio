import type { HandlerContextVariables, StudioCustomer } from "@/types.ts";
import { getStripeAccountId } from "@/lib/stripe.ts";
import { assert } from "@/_deps.ts";
import { createServiceSupabaseClient } from "@/lib/supabase.ts";
import { defaultInstanceId } from "@/constants.ts";

export type CreateInput = {
  instanceId: string;
  firstName: string;
  lastName: string;
  email: string;
};

export type CreateResult = {
  customer: StudioCustomer;
  stripeCustomerId: string;
};

export async function create(
  ctx: HandlerContextVariables,
  input: CreateInput,
): Promise<CreateResult> {
  const db = ctx.db.elwood;
  const stripeAccountIid = await getStripeAccountId(input.instanceId);
  const supabase = createServiceSupabaseClient();

  return await db.connection.transaction().execute(async (tx_) => {
    const tx = tx_.withSchema("elwood");
    const name = [input.firstName, input.lastName].join(" ");

    // see if there's an existing customer
    // if there is we can can skip creating a user and new customer
    let customer = await tx.selectFrom("studio_customer")
      .selectAll()
      .where("email", "=", input.email)
      .where("instance_id", "=", input.instanceId)
      .executeTakeFirst();

    // if there's no customer we need to first check if a user
    // exists with this email and then check if there's a customer
    // with this email
    if (!customer) {
      type DB = { users: { id: string; email: string; instance_id: string } };
      const authDb = ctx.db.generic<DB>().withSchema("auth");

      let user = await authDb
        .selectFrom("users")
        .select("id")
        .where("email", "=", input.email)
        .where("instance_id", "=", input.instanceId)
        .executeTakeFirst();

      if (!user) {
        const createUserResult = await supabase.auth.admin.createUser({
          email: input.email,
        });

        if (createUserResult.error) {
          throw createUserResult.error;
        }

        assert(createUserResult.data.user.id, "Unable to create user");

        // if the user isn't in the default instance we need to
        // update their row and move them to the right instance
        if (input.instanceId !== defaultInstanceId) {
          await authDb.updateTable("users")
            .set({ instance_id: input.instanceId })
            .where("id", "=", createUserResult.data.user.id)
            .execute();
        }

        user = {
          id: createUserResult.data.user.id,
        };
      }

      customer = await tx.insertInto("studio_customer")
        .values({
          instance_id: input.instanceId,
          email: input.email,
          user_id: user.id,
          metadata: {
            name,
          },
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    }

    assert(customer?.id, "customer not found");

    let stripeCustomerId = customer.metadata?.stripe_id;

    if (!stripeCustomerId) {
      const stripeCustomer = await ctx.stripe.customers.create({
        email: input.email,
        name: name,
        metadata: {
          customer_id: customer.id,
          instance_id: input.instanceId,
        },
      }, {
        stripeAccount: stripeAccountIid,
      });

      const _updatedCustomer = await tx.updateTable("studio_customer")
        .set({
          metadata: {
            stripe_id: stripeCustomer.id,
          },
        })
        .returningAll()
        .where("id", "=", customer.id)
        .executeTakeFirstOrThrow();

      stripeCustomerId = stripeCustomer.id;
    }

    assert(stripeCustomerId, "stripeCustomerId not found");

    return {
      customer,
      stripeCustomerId,
    };
  });
}

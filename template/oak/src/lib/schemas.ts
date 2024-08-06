import {z} from 'zod';

export const checkoutFormSchema = z.object({
  first_name: z
    .string()
    .min(2, {
      message: 'First name must be at least 2 characters',
    })
    .max(200, {
      message: 'First name must be less than 200 characters',
    }),
  last_name: z
    .string()
    .min(2, {
      message: 'Last name must be at least 2 characters',
    })
    .max(200, {
      message: 'Last name must be less than 200 characters',
    }),
  email: z.string().email(),
});

export const authenticatedCheckoutFormSchema = z.object({});

export type CheckoutForm = z.infer<
  typeof checkoutFormSchema | typeof authenticatedCheckoutFormSchema
>;

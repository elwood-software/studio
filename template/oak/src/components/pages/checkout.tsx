'use client';

import {useFormState} from 'react-dom';
import {useForm, SubmitHandler} from 'react-hook-form';
import {useRouter} from 'next/navigation';
import {zodResolver} from '@hookform/resolvers/zod';
import {ChevronRight, ArrowLeft} from 'lucide-react';
import {default as Link} from 'next/link';

import type {Plan, PlanPrice} from '@/types';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardFooter} from '../ui/card';
import {
  authenticatedCheckoutFormSchema,
  checkoutFormSchema,
  type CheckoutForm,
} from '@/lib/schemas';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {PlanPrices} from '@/components/plans/prices';
import {PlanHeader} from '@/components/plans/header';
import {Spinner} from '@/components/spinner';
import {useAppContext} from '@/hooks/use-app-context';

import type {CheckoutActionData, CheckoutActionState} from '@/types';

export type CheckoutPageProps = {
  plan: Plan;
  price: PlanPrice;
  formAction: (
    state: CheckoutActionState,
    data: CheckoutActionData,
  ) => Promise<CheckoutActionState>;
};

export function CheckoutPage(props: CheckoutPageProps) {
  const router = useRouter();
  const [state, formAction_] = useFormState<
    CheckoutActionState,
    CheckoutActionData
  >(props.formAction, {
    loading: false,
    success: false,
  });
  const {plan, price} = props;
  const [{isAuthenticated, user}] = useAppContext();

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(
      isAuthenticated ? authenticatedCheckoutFormSchema : checkoutFormSchema,
    ),
    defaultValues: {
      first_name: user?.user_metadata.first_name ?? '',
      last_name: user?.user_metadata.last_name ?? '',
      email: user?.email ?? '',
    },
  });

  const formAction = formAction_ as unknown as (data: FormData) => void;

  const onSubmit: SubmitHandler<CheckoutForm> = async function onSubmit(
    data,
    e,
  ) {
    e?.preventDefault();

    formAction_({
      ...data,
      price_id: price.id,
      plan_id: plan.id,
    });
  };

  function onPriceChange(nextPrice: string) {
    router.replace(
      `/subscribe/checkout?${new URLSearchParams({plan: plan.id, price: nextPrice}).toString()}`,
    );
  }

  console.log(form.formState.errors);

  return (
    <Form {...form}>
      <form
        action={formAction as unknown as (data: FormData) => void}
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col items-center justify-center size-full">
        <Card className="w-full max-w-[50%]">
          <PlanHeader
            plan={plan}
            prepend={
              <Link
                href="/subscribe"
                className="flex items-center text-xs text-muted-foreground">
                <ArrowLeft className="size-[0.9em] mr-1" />
                Back to Subscriptions
              </Link>
            }>
            <div className="pt-6">
              <PlanPrices plan={plan} onChange={onPriceChange} />
            </div>
          </PlanHeader>

          <CardContent className="space-y-6 pt-6">
            {state?.errors && (
              <div className="text-red-400 ">
                {state?.errors.map((error, index) => (
                  <div key={index}>{error}</div>
                ))}
              </div>
            )}

            {isAuthenticated === null && (
              <div className="">
                <Spinner />
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="first_name"
                render={({field}) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input
                        readOnly={!!isAuthenticated}
                        autoFocus={true}
                        placeholder=""
                        className="read-only:bg-muted read-only:focus:ring-0"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription></FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="last_name"
                render={({field}) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input
                        readOnly={!!isAuthenticated}
                        className="read-only:bg-muted read-only:focus:ring-0"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription></FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({field}) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      className="read-only:bg-muted read-only:focus:ring-0"
                      readOnly={!!isAuthenticated}
                      type="email"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-muted-foreground/50">
                    We'll never share your email with anyone else.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className="bg-muted pt-6 rounded-b-lg flex flex-col items-center border-t">
            <Button
              disabled={state.loading || form.formState.isSubmitting}
              type="submit"
              className="w-full"
              autoFocus={isAuthenticated === false}>
              {state.loading || form.formState.isSubmitting ? (
                <Spinner className="size-[0.9em]" />
              ) : (
                <>
                  Continue <ChevronRight />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        <small className="block text-center mt-2 text-muted-foreground/50">
          By continuing you agree to Elwood Studio{' '}
          <a
            className="underline"
            target="_blank"
            href="https://elwood.company/legal/terms">
            Terms of Use
          </a>{' '}
          &{' '}
          <a
            className="underline"
            target="_blank"
            href="https://elwood.company/legal/terms">
            Privacy Policy
          </a>
        </small>
      </form>
    </Form>
  );
}

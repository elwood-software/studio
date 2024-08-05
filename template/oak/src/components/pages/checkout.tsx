'use client';

import {type ComponentProps} from 'react';
import {useForm, SubmitHandler} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {ChevronRight} from 'lucide-react';

import type {Plan, PlanPrice} from '@/types';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Card, CardHeader, CardContent, CardFooter} from '../ui/card';
import {checkoutFormSchema, type CheckoutForm} from '@/lib/schemas';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {Spinner} from '@/components/spinner';
import {useAppContext} from '@/hooks/use-app-context';

export type CheckoutPageProps = {
  plan: Plan;
  price: PlanPrice;
  submitButtonProps: ComponentProps<typeof Button>;
};

export function CheckoutPage(props: CheckoutPageProps) {
  const {plan} = props;
  const [{isAuthenticated}] = useAppContext();
  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
    },
  });

  const onSubmit: SubmitHandler<CheckoutForm> = function onSubmit(_, e) {
    if (typeof props.submitButtonProps?.formAction === 'function') {
      props.submitButtonProps?.formAction?.(new FormData(e?.target));
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col items-center justify-center size-full">
        <Card className="w-full max-w-[50%]">
          <CardHeader>{plan.title}</CardHeader>

          {isAuthenticated === null && (
            <CardContent>
              <Spinner />
            </CardContent>
          )}

          {isAuthenticated === false && (
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="" {...field} />
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
                        <Input {...field} />
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
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormDescription className="text-muted-foreground/50">
                      We'll never share your email with anyone else.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          )}
          <CardFooter className="bg-muted pt-6 rounded-b-lg flex flex-col items-center border-t">
            <Button
              {...props.submitButtonProps}
              type="submit"
              className="w-full">
              Continue <ChevronRight />
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

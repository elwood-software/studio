import {CheckoutCompletePage} from '@/components/pages/checkout-complete';
import {createClient} from '@/utils/supabase/server';
import {Api} from '@/data/api';
import {serverFetch} from '@/lib/server-fetch';

export const dynamic = 'force-dynamic';

export type PageProps = {
  searchParams: {
    plan: string;
  };
};

export default async function Page(props: PageProps) {
  const api = Api.server(serverFetch);
  const client = createClient();
  const session = await client.auth.getSession();

  if (!session.data.session) {
    return <div>You must be logged in</div>;
  }

  const subscriptions = await api.subscriptions({
    plan_id: props.searchParams.plan,
  });

  return (
    <CheckoutCompletePage
      plan_id={props.searchParams.plan}
      initialData={subscriptions}
    />
  );
}

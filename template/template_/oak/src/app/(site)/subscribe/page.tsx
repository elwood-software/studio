import {SubscribePage} from '@/components/pages/subscribe';
import {Api} from '@/data/api';
import {serverFetch} from '@/lib/server-fetch';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const plans = await Api.server(serverFetch).plans();
  return <SubscribePage plans={plans} />;
}

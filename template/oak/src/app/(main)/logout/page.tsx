import {createClient} from '@/utils/supabase/server';
import {redirect} from 'next/navigation';

import {Logout} from '@/components/pages/logout';

export default async function Page() {
  const client = createClient();

  await client.auth.signOut();

  return <Logout />;
}

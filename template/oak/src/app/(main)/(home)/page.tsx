import {Api} from '@/data/api';
import {serverFetch} from '@/lib/server-fetch';

import {default as ShowPage} from '../[show]/(index)/page';

export default async function Index() {
  const api = Api.server(serverFetch);
  const site = await api.site();
  return <ShowPage params={{show: site.main_node_id}} />;
}

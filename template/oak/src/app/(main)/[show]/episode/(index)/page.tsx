import {Api, EpisodesFilter} from '@/data/api';
import {serverFetch} from '@/lib/server-fetch';

export default async function Page() {
  // const api = Api.server(serverFetch);
  // const site = await api.site();
  // const filter: EpisodesFilter = {
  //   show_id: site.main_node_id,
  //   category: 'PUBLIC',
  // };
  // const initialData = await api.episodes(filter);

  return <div>Show/Episode</div>;
}

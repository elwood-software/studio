import {ShowPage} from '@/components/pages/show';
import {Api} from '@/data/api';
import {serverFetch} from '@/lib/server-fetch';

export type PageProps = {
  params: {
    show: string;
  };
};

export default async function Page(props: PageProps) {
  const api = Api.server(serverFetch);
  const initialData = await api.showEpisodes(props.params.show);

  return <ShowPage episodes={initialData} id={props.params.show} />;
}

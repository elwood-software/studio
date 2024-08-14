import {notFound} from 'next/navigation';
import {Api} from '@/data/api';
import {serverFetch} from '@/lib/server-fetch';
import {EpisodePage} from '@/components/pages/episode';

export type PageProps = {
  params: {
    show: string;
    episode: string;
  };
};

export default async function Page(props: PageProps) {
  const api = Api.server(serverFetch);
  const episode = await api.episode(props.params.episode);

  if (!episode) {
    notFound();
  }

  return <EpisodePage initialData={episode} id={props.params.episode} />;
}

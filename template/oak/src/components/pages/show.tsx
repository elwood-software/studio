'use client';

import Link from 'next/link';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import {MediaType} from '@/hooks/use-player-control';
import {Episode} from '@/types';

import {PlayerButton} from '@/components/player/button';
import {useShowEpisodes} from '@/data/use-show-episodes';

export type ShowPageProps = {
  id: string;
  episodes: Episode[];
};

export function ShowPage(props: ShowPageProps): JSX.Element {
  const {data} = useShowEpisodes(props.id, {
    initialData: props.episodes,
  });

  return (
    <div className="grid grid-cols-[3fr_1fr] grid-rows-[auto_1fr] size-full">
      <div className="border-b px-12 py-12 col-span-2">
        <h2 className="text-xl font-medium">The Latest</h2>
        <h3 className="text-muted-foreground">
          Highlights, recent episodes, exclusives, and more
        </h3>
        <Carousel className="mx-0 mt-6">
          <CarouselContent>
            <CarouselItem className="basis-1/3">
              <Link href="/show-id/episode/episode-id/video/video-id">
                <img src="https://placehold.co/600x400" />
                <h3>Poop</h3>
              </Link>
            </CarouselItem>
            <CarouselItem className="basis-1/3">
              <a href="/epsiode/asdadasd">
                <img src="https://placehold.co/600x400" />
              </a>
            </CarouselItem>
            <CarouselItem className="basis-1/3">
              <img src="https://placehold.co/600x400" />
            </CarouselItem>
            <CarouselItem className="basis-1/3">
              <img src="https://placehold.co/600x400" />
            </CarouselItem>
            <CarouselItem className="basis-1/3">
              <img src="https://placehold.co/600x400" />
            </CarouselItem>
            <CarouselItem className="basis-1/3">
              <img src="https://placehold.co/600x400" />
            </CarouselItem>
          </CarouselContent>
        </Carousel>
      </div>

      <div className="p-12">
        <header className="pb-6">
          <h2 className="text-xl font-medium">Episode</h2>
          <h3 className="text-muted-foreground">Listen now</h3>
        </header>
        <div className="space-y-6 overflow-y-auto">
          {Array.from(data ?? []).map(episode => {
            return (
              <div className="pt-6" key={`ShowPage-Episode-${episode.id}`}>
                <time className="text-muted-foreground font-medium text-xs uppercase">
                  {new Date(episode.published_at).toDateString()}
                </time>

                <h4 className="font-bold mt-2 mb-1">
                  <Link href={`/${episode.show_id}/episode/${episode.id}`}>
                    {episode.number ? `${episode.number}. ` : ''}
                    {episode.title}
                  </Link>
                </h4>

                <section className="text-sm text-foreground/90 mb-3">
                  <span
                    dangerouslySetInnerHTML={{
                      __html: episode.description,
                    }}
                  />
                </section>

                <footer className="flex items-center space-x-3">
                  {episode.audio_playback_license_id && (
                    <PlayerButton
                      className="flex items-center space-x-1 font-bold text-xs uppercase text-muted-foreground hover:text-foreground hover:underline"
                      type="start-play-pause"
                      mediaType={MediaType.Audio}
                      startOptions={{
                        node_id: episode.id,
                        playback_license_id: episode.audio_playback_license_id,
                      }}
                    />
                  )}
                  {episode.video_playback_license_id && (
                    <PlayerButton
                      className="flex items-center space-x-1 font-bold text-xs uppercase text-muted-foreground hover:text-foreground hover:underline"
                      type="start-play-pause"
                      mediaType={MediaType.Video}
                      startOptions={{
                        node_id: episode.id,
                        playback_license_id: episode.video_playback_license_id,
                      }}
                    />
                  )}
                </footer>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

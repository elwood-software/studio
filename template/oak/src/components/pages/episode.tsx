'use client';

import type {Episode} from '@/types';
import {useEpisode} from '@/data/use-episode';
import {VideoPlayer} from '@/components/player/video';

export type EpisodePageProps = {
  id: string;
  initialData: Episode;
};

export function EpisodePage(props: EpisodePageProps): JSX.Element {
  const {data} = useEpisode(props.id, {
    initialData: props.initialData,
  });

  return (
    <>
      <div className="grid grid-cols-[3fr_1fr] min-h-full">
        <div>
          {data?.video_playback_license_id && (
            <div className="mb-12">
              <VideoPlayer name="video-page" />
            </div>
          )}
          <header className="px-12">
            <h1 className="text-3xl mb-3 font-bold">{data?.title}</h1>
            <section
              className="text-lg text-muted-foreground"
              dangerouslySetInnerHTML={{__html: data?.description ?? ''}}
            />
          </header>
        </div>
        <div className="border-l"></div>
      </div>
    </>
  );
}

'use client';

import Link from 'next/link';

import {cn, formatTime, parseTime} from '@/lib/utils';
import {PlayerButton} from './button';
import {PlayerScrubber} from './scrubber';
import {usePlayerControl} from '@/hooks/use-player-control';
import {useEpisode} from '@/data/use-episode';

export type MiniAudioPlayerProps = {
  className?: string;
};

export function MiniAudioPlayer(props: MiniAudioPlayerProps) {
  const {
    audio: {currentTime, duration, currentId},
  } = usePlayerControl();
  const episode = useEpisode(currentId, {
    enabled: !!currentId,
  });

  return (
    <div className={cn(props.className, 'flex items-center space-x-6')}>
      <PlayerButton type="play-pause" className="size-16" />
      <div className="flex flex-col w-full">
        {currentId && (
          <header className="pb-3">
            <Link
              href={`/${episode.data?.show_id}/episode/${episode.data?.id}`}
              className="font-medium">
              {episode.data?.title ?? '...'}
            </Link>
          </header>
        )}
        <div>
          <PlayerScrubber />
          <div className="grid grid-cols-3 text-xs text-muted-foreground mt-1">
            <div className="font-mono">
              {formatTime(parseTime(currentTime), parseTime(duration))}
            </div>
            <div className="flex items-center justify-center"> </div>
            <div className="font-mono flex justify-end">
              {formatTime(parseTime(duration))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import {cn, formatTime, parseTime} from '@/lib/utils';

import {PlayerButton} from './button';
import {PlayerScrubber} from './scrubber';
import {usePlayController} from '@/hooks/use-play-controller';

export type MinPlayerProps = {
  className?: string;
};

export function MinPlayer(props: MinPlayerProps) {
  const {currentTime, duration} = usePlayController();

  return (
    <div className={cn(props.className, 'flex items-center space-x-3')}>
      <PlayerButton type="play-pause" />
      <div className="flex flex-col w-full">
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
  );
}

'use client';

import {PauseIcon, PlayIcon} from 'lucide-react';

import {cn} from '@/lib/utils';
import {usePlayController} from '@/hooks/use-play-controller';

export type PlayerButtonProps = {
  type: 'play-pause' | 'forward' | 'back';
  id?: string;
  className?: string;
};

export function PlayerButton(props: PlayerButtonProps) {
  const {play, pause, currentId, playing} = usePlayController();
  const wantToPlayId = props.id ?? currentId ?? '';

  switch (props.type) {
    case 'play-pause': {
      const cl = cn(
        'size-12 bg-muted flex items-center justify-center rounded-full',
        props.className,
      );

      if (playing && currentId === wantToPlayId) {
        return (
          <button className={cl} onClick={pause}>
            <PauseIcon className="size-[1.1rem] fill-current" />
          </button>
        );
      }

      return (
        <button className={cl} onClick={() => play()}>
          <PlayIcon className="size-[1.1rem] fill-current" />
        </button>
      );
    }

    default:
      return <></>;
  }
}

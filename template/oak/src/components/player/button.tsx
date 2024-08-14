'use client';

import {PauseIcon, PlayIcon, Tv2Icon, HeadphonesIcon} from 'lucide-react';

import {cn} from '@/lib/utils';
import {
  MediaType,
  usePlayerControl,
  type PlayerControlStartOptions,
} from '@/hooks/use-player-control';

export type PlayerButtonProps = {
  type: 'play-pause' | 'forward' | 'back' | 'start-play-pause';
  mediaType: MediaType;
  id?: string;
  className?: string;
  startOptions?: PlayerControlStartOptions;
};

export function PlayerButton(props: PlayerButtonProps) {
  const {start, active, isCurrent} = usePlayerControl();
  const {play, pause, currentId, playing} = active;
  const wantToPlayId = props.id ?? currentId ?? '';
  const mediaType = props.mediaType ?? active.mediaType;

  switch (props.type) {
    case 'start-play-pause': {
      const options = props.startOptions as PlayerControlStartOptions;
      const Icon = mediaType === 'audio' ? HeadphonesIcon : Tv2Icon;
      const text = mediaType === 'audio' ? 'Listen' : 'Watch';
      const isCurrent_ = isCurrent(mediaType, options);

      return (
        <button
          className={props.className}
          onClick={() => {
            if (playing && isCurrent_) {
              pause();
              return;
            }
            if (!playing && isCurrent_) {
              play();
              return;
            }
            start(mediaType, options);
          }}>
          {isCurrent_ && (
            <>
              {playing === true && (
                <PauseIcon className="size-[1em] fill-current" />
              )}
              {playing === false && (
                <PlayIcon className="size-[1em] fill-current" />
              )}
            </>
          )}

          {!isCurrent_ && <Icon className="size-[1em]" />}
          <span>{text}</span>
        </button>
      );
    }

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

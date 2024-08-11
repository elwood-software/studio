'use client';

import {usePlayerControl} from '@/hooks/use-player-control';
import {MiniAudioPlayer} from './mini-audio';

export type MinPlayerProps = {
  className?: string;
};

export function MinPlayer(props: MinPlayerProps) {
  const {active} = usePlayerControl();

  if (active.mediaType === 'video') {
    return <></>;
  }

  return <MiniAudioPlayer className={props.className} />;
}

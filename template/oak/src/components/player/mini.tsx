'use client';

import {usePlayerControl} from '@/hooks/use-player-control';
import {MiniAudioPlayer} from './mini-audio';
import {MiniVideoPlayer} from './mini-video';

export type MinPlayerProps = {
  className?: string;
};

export function MinPlayer(props: MinPlayerProps) {
  const {active} = usePlayerControl();

  if (active.mediaType === 'video') {
    return <MiniVideoPlayer />;
  }

  return <MiniAudioPlayer className={props.className} />;
}

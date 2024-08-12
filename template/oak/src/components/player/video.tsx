import {useEffect, useRef, createRef} from 'react';
import {useIntersection, useScrolling} from 'react-use';

import {CustomEventName} from '@/lib/events';
import {usePlayerControl} from '@/hooks/use-player-control';

export type VideoPlayerProps = {
  name: string;
};

export function VideoPlayer(props: VideoPlayerProps) {
  const {video} = usePlayerControl();
  const ref = useRef<HTMLDivElement>(null);
  const intersection = useIntersection(ref, {
    root: null,
    rootMargin: '0px',
    threshold: 1,
  });

  useEffect(() => {
    ['top', 'left', 'width', 'height'].forEach(style => {
      video.ref?.current?.style.setProperty(
        style,
        `${intersection?.boundingClientRect[style as keyof DOMRectReadOnly]}px`,
      );
    });

    video.ref?.current?.style.setProperty('opacity', '1');
  }, [intersection?.boundingClientRect]);

  return (
    <div className="bg-black border-b video-container relative" ref={ref}>
      <div className="video-container-inner" />
    </div>
  );
}

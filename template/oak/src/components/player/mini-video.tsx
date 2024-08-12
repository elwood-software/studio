import {useEffect, useRef, useState} from 'react';
import {useIntersection} from 'react-use';

import {ScrollTargetChange, CustomEventName} from '@/lib/events';
import {usePlayerControl} from '@/hooks/use-player-control';
import {cn} from '@/lib/utils';

export function MiniVideoPlayer() {
  const [show, setShow] = useState(true);
  const {video} = usePlayerControl();
  const ref = useRef<HTMLDivElement>(null);
  const intersection = useIntersection(ref, {
    root: null,
    rootMargin: '0px',
    threshold: 1,
  });

  useEffect(() => {
    if (show) {
      ['top', 'left', 'width', 'height'].forEach(style => {
        video.ref?.current?.style.setProperty(
          style,
          `${intersection?.boundingClientRect[style as keyof DOMRectReadOnly]}px`,
        );
      });
    }
  }, [intersection?.boundingClientRect]);

  useEffect(() => {
    function onChange(e: ScrollTargetChange) {
      setShow(e.detail[1] > 0);
    }

    document.addEventListener(CustomEventName.ScrollTargetChange, onChange);

    return function cleanup() {
      document.removeEventListener(
        CustomEventName.ScrollTargetChange,
        onChange,
      );
    };
  }, [video.active]);

  if (!video.active) {
    return null;
  }

  const cl = cn(
    'fixed bottom-3 right-3 rounded flex items-center justify-center bg-black border-black border-4',
    {
      'opacity-0': !show,
      'opacity-100': show,
    },
  );

  return (
    <div className={cl}>
      <div className="min-video-container" ref={ref}>
        <div className="video-container-inner" />
      </div>
    </div>
  );
}

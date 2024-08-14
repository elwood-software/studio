import {useEffect, useRef, useState} from 'react';
import {useCss, useMeasure} from 'react-use';

import {ScrollTargetChange, CustomEventName} from '@/lib/events';
import {usePlayerControl} from '@/hooks/use-player-control';
import {cn} from '@/lib/utils';

export function MiniVideoPlayer() {
  const [show, setShow] = useState(true);
  const {video} = usePlayerControl();
  const [ref, m] = useMeasure<HTMLDivElement>();

  useEffect(() => {
    if (show) {
      video.position({
        bottom: `0.75rem`,
        right: `0.75rem`,
        width: `${m.width}px`,
        height: `${m.height}px`,
      });
    }
  }, [show, m.width, m.height]);

  useEffect(() => {
    if (!video.anchorTo) {
      setShow(true);
      return;
    }

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
  }, [video.active, video.anchorTo]);

  if (!video.active) {
    return null;
  }

  const cl = cn(
    'fixed bottom-3 right-3 rounded flex items-center justify-center bg-black shadow-xl',
    {
      'opacity-0': !show,
      'opacity-100': show,
    },
    {
      '--video-player-top': `0px`,
      '--video-player-left': `0px`,
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

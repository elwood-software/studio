'use client';

import {useRef, useState, useEffect} from 'react';
import {
  type SliderState,
  type SliderStateOptions,
  useSliderState,
} from 'react-stately';
import {
  type AriaSliderProps,
  mergeProps,
  useFocusRing,
  useSlider,
  useSliderThumb,
  VisuallyHidden,
} from 'react-aria';

import {cn, formatHumanTime, parseTime, formatTime} from '@/lib/utils';
import {usePlayerControl} from '@/hooks/use-player-control';

export type PlayerScrubberProps = {
  className?: string;
  label?: string;
};

export function PlayerScrubber(props: PlayerScrubberProps) {
  const wasPlayingRef = useRef(false);
  const {active: controller} = usePlayerControl();
  const [currentTime, setCurrentTime] = useState<number | null>(
    controller.currentTime,
  );

  useEffect(() => {
    setCurrentTime(null);
  }, [controller.currentTime]);

  const sliderProps: SliderStateOptions<Array<number>> & {
    onChangeStart?: () => void;
  } = {
    label: props.label ?? 'Slider',
    maxValue: controller.duration,
    step: 1,
    value: [currentTime ?? controller.currentTime],
    onChange: ([value]) => setCurrentTime(value),
    onChangeEnd: ([value]) => {
      controller.seek(value);
      if (wasPlayingRef.current) {
        controller.play();
      }
    },
    numberFormatter: {format: formatHumanTime} as Intl.NumberFormat,
    onChangeStart: () => {
      wasPlayingRef.current = controller.playing;
      controller.pause();
    },
  };

  return (
    <div className={cn(props.className, 'w-full h-3 relative')}>
      <ScrubberTrack {...sliderProps} />
    </div>
  );
}

export type ScrubberTrackProps = SliderStateOptions<Array<number>> & {
  onChangeStart?: () => void;
};
export function ScrubberTrack(props: ScrubberTrackProps) {
  const trackRef = useRef<React.ElementRef<'div'>>(null);
  const state = useSliderState(props);
  const {focusProps, isFocusVisible} = useFocusRing();
  const {groupProps, trackProps, labelProps, outputProps} = useSlider(
    props,
    state,
    trackRef,
  );

  const currentTime_ = parseTime(state.getThumbValue(0));
  const totalTime_ = parseTime(state.getThumbMaxValue(0));

  return (
    <div className={cn('w-full h-3 relative')}>
      {props.label && (
        <label className="sr-only" {...labelProps}>
          {props.label}
        </label>
      )}
      <div
        {...groupProps}
        className="flex flex-auto touch-none items-center gap-6 md:relative">
        <div
          {...trackProps}
          ref={trackRef}
          className="relative w-full bg-muted md:rounded-full">
          <div
            className={cn(
              'h-2 md:rounded-l-xl md:rounded-r-md transition-all',
              isFocusVisible || state.isThumbDragging(0)
                ? 'bg-slate-900'
                : 'bg-foreground',
            )}
            style={{
              width:
                state.getThumbValue(0) === 0
                  ? 0
                  : `calc(${state.getThumbPercent(0) * 100}% - ${
                      isFocusVisible || state.isThumbDragging(0)
                        ? '0.3125rem'
                        : '0.25rem'
                    })`,
            }}
          />
        </div>
      </div>
      <div className="hidden items-center gap-2">
        <output
          {...outputProps}
          aria-live="off"
          className={cn(
            'hidden rounded-md px-1 py-0.5 font-mono text-sm leading-6 md:block',
            state.getThumbMaxValue(0) === 0 && 'opacity-0',
            isFocusVisible || state.isThumbDragging(0)
              ? 'bg-slate-100 text-slate-900'
              : 'text-slate-500',
          )}>
          {formatTime(currentTime_, totalTime_)}
        </output>
        <span className="text-sm leading-6 text-slate-300" aria-hidden="true">
          /
        </span>
        <span
          className={cn(
            'hidden rounded-md px-1 py-0.5 font-mono text-sm leading-6 text-slate-500 md:block',
            state.getThumbMaxValue(0) === 0 && 'opacity-0',
          )}>
          {formatTime(totalTime_)}
        </span>
      </div>
    </div>
  );
}

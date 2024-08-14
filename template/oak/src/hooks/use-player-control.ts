import {
  useReducer,
  createContext,
  createElement,
  useContext,
  useRef,
  useState,
  Fragment,
  useEffect,
  type Context,
  type RefObject,
  PropsWithChildren,
} from 'react';
import {useIsomorphicLayoutEffect} from 'react-use';
import {create, NanoRenderer} from 'nano-css';
import {addon as addonCSSOM, CSSOMAddon} from 'nano-css/addon/cssom';
import {addon as addonVCSSOM, VCSSOMAddon} from 'nano-css/addon/vcssom';
import {cssToTree} from 'nano-css/addon/vcssom/cssToTree';

import {Api} from '../data/api';
import {useAppContext} from './use-app-context';
import type {ApiGetPlaybackUrlInput} from '@/types';

export enum MediaType {
  Video = 'video',
  Audio = 'audio',
}

type Nano = NanoRenderer & CSSOMAddon & VCSSOMAddon;
const nano = create() as Nano;
addonCSSOM(nano);
addonVCSSOM(nano);

const AudioPlayerContext =
  createContext<PlayController<MediaType.Audio> | null>(null);
const VideoPlayerContext =
  createContext<PlayController<MediaType.Video> | null>(null);

type ReducerCallback<Type extends MediaType> = (
  state: PlayControllerState<Type>,
  action: PlayControllerAction<Type>,
) => PlayControllerState<Type>;

export type PlayControllerState<Type extends MediaType> = {
  mediaType: Type;
  active: boolean;
  currentId: string | null;
  currentLicense: string | null;
  playing: boolean;
  muted: boolean;
  duration: number;
  currentTime: number;
  anchorTo: string | null;
};

const _defaultPlayControllerState: Omit<
  PlayControllerState<MediaType.Audio>,
  'mediaType'
> = {
  active: false,
  currentId: null,
  currentLicense: null,
  playing: false,
  muted: false,
  duration: 0,
  currentTime: 0,
  anchorTo: null,
};

const defaultAudioPlayerControlState: PlayControllerState<MediaType.Audio> = {
  mediaType: MediaType.Audio,
  ..._defaultPlayControllerState,
};

const defaultVideoPlayerControlState: PlayControllerState<MediaType.Video> = {
  mediaType: MediaType.Video,
  ..._defaultPlayControllerState,
};

export type PlayerControlStartOptions = Omit<ApiGetPlaybackUrlInput, 'client'>;
export type PlayerControlPosition = Partial<{
  top: string;
  left: string;
  right: string;
  width: string;
  height: string;
  bottom: string;
  opacity: string;
}>;

export type PlayController<Type extends MediaType> =
  PlayControllerState<Type> & {
    start: (options: PlayerControlStartOptions) => void;
    startAsync: (options: PlayerControlStartOptions) => Promise<void>;
    play: () => void;
    pause: () => void;
    stop: () => void;
    seek: (time: number) => void;
    anchor: (el: HTMLDivElement | null) => void;
    position(pos: PlayerControlPosition): void;
    ref: RefObject<HTMLAudioElement | HTMLVideoElement> | null;
  };
export type AudioPlayController = PlayController<MediaType.Audio> & {
  ref: RefObject<HTMLAudioElement> | null;
};
export type VideoPlayController = PlayController<MediaType.Video> & {
  ref: RefObject<HTMLVideoElement> | null;
};

export type PlayControllerAction<Type extends MediaType> =
  | {
      type: 'init';
      value: Partial<PlayControllerState<Type>>;
    }
  | {
      type: 'play';
    }
  | {
      type: 'pause';
    }
  | {
      type: 'set-mute';
      value: boolean;
    }
  | {
      type: 'set-current-time';
      value: number;
    }
  | {
      type: 'set-duration';
      value: number;
    }
  | {
      type: 'set-current-id';
      value: string;
    }
  | {
      type: 'set-current-license';
      value: string;
    }
  | {
      type: 'set-active';
      value: boolean;
    }
  | {
      type: 'set-anchor-to';
      value: string;
    };

export function updateLocalStorageMiddleware<Type extends MediaType>(
  storageKey: string,
  next: ReducerCallback<Type>,
) {
  return function (
    state: PlayControllerState<Type>,
    action: PlayControllerAction<Type>,
  ) {
    const _state = next(state, action);

    localStorage.setItem(
      storageKey,
      JSON.stringify({
        _lastUpdated: Date.now(),
        currentId: _state.currentId,
        currentTime: _state.currentTime,
        muted: _state.muted,
      }),
    );

    return _state;
  };
}

export function reducer<Type extends MediaType>(
  state: PlayControllerState<Type>,
  action: PlayControllerAction<Type>,
): PlayControllerState<Type> {
  // console.log(state.mediaType, action);

  switch (action.type) {
    case 'init': {
      return {
        ...state,
        ...action.value,
      };
    }
    case 'set-current-id': {
      return {
        ...state,
        currentId: action.value,
      };
    }
    case 'play':
      return {
        ...state,
        active: true,
        playing: true,
      };
    case 'pause':
      return {
        ...state,
        playing: false,
      };
    case 'set-mute':
      return {
        ...state,
        muted: action.value,
      };
    case 'set-current-time':
      return {
        ...state,
        currentTime: action.value,
      };
    case 'set-duration':
      return {
        ...state,
        duration: action.value,
      };
    case 'set-active':
      return {
        ...state,
        active: action.value,
      };
    case 'set-current-license': {
      return {
        ...state,
        currentLicense: action.value,
      };
    }
    case 'set-anchor-to': {
      return {
        ...state,
        anchorTo: action.value,
      };
    }
    default:
      return state;
  }
}

export type PlayerControlProviderProps<Type extends MediaType> = {
  mediaType: MediaType;
  context: Context<PlayController<Type> | null>;
};

export function PlayerControlProvider<Type extends MediaType>(
  props: PropsWithChildren<PlayerControlProviderProps<Type>>,
) {
  const storageKey = `${props.mediaType}-player-state`;
  const [position, setPosition] = useState<PlayerControlPosition>({});
  const [{client}] = useAppContext();
  const ref = useRef<HTMLAudioElement>(null);
  const [state, dispatch] = useReducer<
    ReducerCallback<Type>,
    PlayControllerState<Type>
  >(
    updateLocalStorageMiddleware(storageKey, reducer),
    (props.mediaType === MediaType.Audio
      ? defaultAudioPlayerControlState
      : defaultVideoPlayerControlState) as PlayControllerState<Type>,
    state => state,
  );

  const css = {
    position: 'fixed',
    top: '-9999rem',
    left: '-9999rem',
    width: 0,
    height: 0,
  };

  async function loadSource(options: PlayerControlStartOptions) {
    await Api.client()
      .getPlaybackUrl({
        client,
        ...options,
      })
      .then(({url}) => {
        dispatch({type: 'set-current-id', value: options.node_id});
        dispatch({
          type: 'set-current-license',
          value: options.playback_license_id,
        });
        dispatch({type: 'set-current-time', value: 0});
        dispatch({type: 'set-duration', value: 0});
        ref.current!.src = url;
      })
      .catch(() => {
        console.log('ERROR');
      });
  }

  const controller: PlayController<Type> = {
    start(options) {
      controller.startAsync(options);
    },
    async startAsync(options) {
      dispatch({type: 'set-active', value: true});
      ref.current?.pause();
      await loadSource(options);
      ref.current!.style.setProperty('opacity', '1');
      ref.current!.currentTime = 0;
      ref.current?.play();
    },
    play: () => {
      ref.current?.play();
    },
    pause: () => {
      ref.current?.pause();
    },
    seek: (time: number) => {
      ref.current!.currentTime = time;
    },
    stop: () => {
      dispatch({type: 'set-active', value: false});
      ref.current?.pause();
    },
    anchor: (el: HTMLDivElement | null) => {
      if (!el) {
        return;
      }

      if (!el.getAttribute('id')) {
        el.setAttribute('id', `anchor-${Date.now()}`);
      }

      dispatch({type: 'set-anchor-to', value: el.getAttribute('id')!});
    },
    position(pos) {
      setPosition(pos);
    },
    ref,
    ...state,
  };

  // when the audio element is ready, load the state from local storage
  useEffect(() => {
    if (ref.current) {
      try {
        const storedState = JSON.parse(
          localStorage.getItem(storageKey) ?? '{}',
        );
        if (storedState) {
          // if the current id's are not the same
          // just ignore the stored state
          if (state.currentId && storedState.currentId !== state.currentId) {
            return;
          }

          dispatch({
            type: 'init',
            value: storedState,
          });

          // if there is a current id, start the audio
          if (storedState.currentId) {
            loadSource(storedState.currentId).then(() => {
              ref.current!.currentTime = storedState.currentTime;
              ref.current!.muted = storedState.muted;
            });
          }
        }
      } catch {
        // noop
      }
    }
  }, [ref]);

  return createElement(Fragment, null, [
    createElement(
      props.context.Provider,
      {value: controller, key: `player-control-provider-${props.mediaType}`},
      props.children,
    ),
    createElement(props.mediaType, {
      key: `player-controller-${props.mediaType}`,
      style: {
        position: 'fixed',
        top: position.top,
        left: position.left,
        right: position.right,
        width: position.width,
        height: position.height,
        bottom: position.bottom,
        opacity: 0,
      },
      ref,
      src: 'https://vjs.zencdn.net/v/oceans.mp4',
      onPlay: () => dispatch({type: 'play'}),
      onPause: () => dispatch({type: 'pause'}),
      onTimeUpdate: event => {
        dispatch({
          type: 'set-current-time',
          value: Math.floor(event.currentTarget.currentTime),
        });
      },
      onDurationChange: event => {
        dispatch({
          type: 'set-duration',
          value: Math.floor(event.currentTarget.duration),
        });
      },
      muted: state.muted,
    }),
  ]);
}

export function AudioPlayerControlProvider(props: PropsWithChildren) {
  return createElement(PlayerControlProvider<MediaType.Audio>, {
    mediaType: MediaType.Audio,
    context: AudioPlayerContext,
    children: props.children,
  });
}

export function VideoPlayerControlProvider(props: PropsWithChildren) {
  return createElement(PlayerControlProvider<MediaType.Video>, {
    mediaType: MediaType.Video,
    context: VideoPlayerContext,
    children: props.children,
  });
}

export function useVideoPlayControl(): VideoPlayController {
  const value = useContext(VideoPlayerContext);

  if (!value) {
    throw new Error(
      'useVideoPlayControl must be used within a PlayControllerProvider',
    );
  }

  return value as VideoPlayController;
}

export function useAudioPlayControl(): AudioPlayController {
  const value = useContext(AudioPlayerContext);

  if (!value) {
    throw new Error(
      'useAudioPlayControl must be used within a PlayControllerProvider',
    );
  }

  return value as AudioPlayController;
}

export type UsePlayerControlResult = {
  start: (
    mediaType: MediaType,
    options: PlayerControlStartOptions,
  ) => Promise<void>;
  active: AudioPlayController | VideoPlayController;
  audio: AudioPlayController;
  video: VideoPlayController;
  startAudio: (options: PlayerControlStartOptions) => Promise<void>;
  startVideo: (options: PlayerControlStartOptions) => Promise<void>;
  isCurrent: (
    mediaType: MediaType,
    options: PlayerControlStartOptions,
  ) => boolean;
};

export function usePlayerControl(): UsePlayerControlResult {
  const audio = useAudioPlayControl();
  const video = useVideoPlayControl();
  const active = audio.active ? audio : video;
  async function start(
    mediaType: MediaType,
    options: PlayerControlStartOptions,
  ) {
    if (mediaType === MediaType.Audio) {
      if (video.active) {
        video.stop();
      }

      await audio.startAsync(options);
    } else {
      if (audio.active) {
        audio.stop();
      }

      await video.startAsync(options);
    }
  }

  return {
    async startAudio(options) {
      return await start(MediaType.Audio, options);
    },
    async startVideo(options) {
      return await start(MediaType.Video, options);
    },
    isCurrent(mediaType, options) {
      return (
        mediaType === active.mediaType &&
        (options.node_id === active.currentId ||
          options.playback_license_id === active.currentLicense)
      );
    },
    start,
    active,
    audio,
    video,
  };
}

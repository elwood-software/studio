import {
  useReducer,
  createContext,
  createElement,
  useContext,
  useRef,
  Fragment,
  useEffect,
} from 'react';

const PlayerControllerContext = createContext<PlayController | null>(null);

const playerStorageKey = 'player-state';

type ReducerCallback = (
  state: PlayControllerState,
  action: PlayControllerAction,
) => PlayControllerState;

export type PlayControllerState = {
  currentId: string | null;
  playing: boolean;
  muted: boolean;
  duration: number;
  currentTime: number;
};

export const defaultPlayControllerState: PlayControllerState = {
  currentId: null,
  playing: false,
  muted: false,
  duration: 0,
  currentTime: 0,
};

export type PlayController = PlayControllerState & {
  start: (id: string) => void;
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
};

export type PlayControllerAction =
  | {
      type: 'init';
      value: Partial<PlayControllerState>;
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
    };

export function updateLocalStorageMiddleware(next: ReducerCallback) {
  return function (state: PlayControllerState, action: PlayControllerAction) {
    const _state = next(state, action);

    localStorage.setItem(
      playerStorageKey,
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

export function reducer(
  state: PlayControllerState,
  action: PlayControllerAction,
): PlayControllerState {
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
    default:
      return state;
  }
}

export function usePlayController(): PlayController {
  const value = useContext(PlayerControllerContext);

  if (!value) {
    throw new Error(
      'usePlayController must be used within a PlayControllerProvider',
    );
  }

  return value;
}

export function PlayControllerProvider(props: {children: React.ReactNode}) {
  const ref = useRef<HTMLAudioElement>(null);
  const [state, dispatch] = useReducer<ReducerCallback, PlayControllerState>(
    updateLocalStorageMiddleware(reducer),
    defaultPlayControllerState,
    state => state,
  );

  // when the audio element is ready, load the state from local storage
  useEffect(() => {
    if (ref.current) {
      try {
        const storedState = JSON.parse(
          localStorage.getItem(playerStorageKey) ?? '{}',
        );
        if (storedState) {
          dispatch({
            type: 'init',
            value: storedState,
          });

          ref.current.currentTime = storedState.currentTime;
          ref.current.muted = storedState.muted;
        }
      } catch {
        // noop
      }
    }
  }, [ref]);

  const controller: PlayController = {
    start: (id: string) => {
      dispatch({type: 'set-current-id', value: id});
      ref.current!.play();
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
    ...state,
  };

  return createElement(Fragment, null, [
    createElement(
      PlayerControllerContext.Provider,
      {value: controller, key: 'player-controller-provider'},
      props.children,
    ),
    createElement('audio', {
      key: 'player-controller-audio',
      ref,
      src: 'https://their-side-feed.vercel.app/episode-005.mp3',
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

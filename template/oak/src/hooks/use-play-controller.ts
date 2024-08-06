export type PlayController = {
  play: (id: string) => void;
  pause: () => void;
  playing: boolean;
  currentId: string | null;
};

export function usePlayController(): PlayController {
  return {
    play: (id: string) => {},
    pause: () => {},
    playing: false,
    currentId: null,
  };
}

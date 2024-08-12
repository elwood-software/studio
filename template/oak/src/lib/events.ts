export enum CustomEventName {
  ScrollTargetChange = 'scroll-target-change',
}

export type ScrollTargetChange = CustomEvent<[number, number]>;

interface CustomEventMap {
  [CustomEventName.ScrollTargetChange]: CustomEvent<[number, number]>;
}

declare global {
  interface Document {
    addEventListener<K extends keyof CustomEventMap>(
      type: K,
      listener: (this: Document, ev: CustomEventMap[K]) => void,
    ): void;
    removeEventListener<K extends keyof CustomEventMap>(
      type: K,
      listener: (this: Document, ev: CustomEventMap[K]) => void,
    ): void;
    dispatchEvent<K extends keyof CustomEventMap>(ev: CustomEventMap[K]): void;
  }
}
export {};

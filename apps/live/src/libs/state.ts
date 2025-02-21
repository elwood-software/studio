import { Stream } from "./stream.ts";

export class State {
  #streams: Map<string, Stream> = new Map();

  add(stream: Stream) {
    this.#streams.set(stream.id, stream);
  }

  get(id: string) {
    return this.#streams.get(id);
  }

  get streams() {
    return this.#streams.entries();
  }
}

export default new State();

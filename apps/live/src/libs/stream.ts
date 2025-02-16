import { wait } from "./utils.ts";

export type StreamInput = {
  loadNextSource(): Promise<string>;
  distributeUrl: string;
  backgroundPort: string;
};

export class Stream {
  readonly id: string;

  #main: Deno.ChildProcess | null = null;

  constructor(private readonly input: StreamInput) {
    this.id = crypto.randomUUID();
  }

  start() {
    setTimeout(() => {
      this.#start_();
    }, 1);
  }

  async #start_() {
    // start our main streaming process. this is the ffmpeg process
    // that will intake UDP streams for
    // 1. the background
    // 2. audio stream
    setTimeout(() => {
      const proc = new Deno.Command("ffmpeg", {
        args: [
          "-i",
          `udp://localhost:${this.input.backgroundPort}`,
          "-f",
          "flv",
          "-c:v",
          "libx264",
          "-b:v",
          "100k",
          "-c:a",
          "aac",
          "-shortest",
          `${this.input.distributeUrl}`,
        ],
      });

      this.#main = proc.spawn();
    }, 1);

    // wait until the sub process launches
    while (this.#main === null) {
      await wait(100);
    }
  }
}

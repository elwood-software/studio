import { isFalsy, isImage, wait } from "./utils.ts";

import ffmpeg from "./ffmpeg.ts";
import { OutputLogger } from "./logger.ts";
import { assert } from "../deps.ts";
import type { Process, ProcessInput } from "./process.ts";

export type StreamState = {
  nextSource: string | null;
  lastSource: string | null;
  data: Record<string, string>;
};

export type StreamInput = {
  createProcess(input: ProcessInput): Process;
  loadNextSource(state: StreamState): Promise<StreamState>;
  distributeUrl: string;
  backgroundPath?: string;
  backgroundUdpUrl?: string;
  contentUdpUrl: string;
};

export class Stream {
  readonly id: string;

  #main: Process | null = null;
  #content: Process | null = null;
  #background: Process | null = null;

  constructor(private readonly input: StreamInput) {
    this.id = crypto.randomUUID();
  }

  get logs(): {
    main?: OutputLogger;
    content?: OutputLogger;
    background?: OutputLogger;
  } {
    return {
      main: this.#main?.logger,
      content: this.#content?.logger,
      background: this.#background?.logger,
    };
  }

  stop() {
    try {
      this.#main?.kill("SIGKILL");
      this.#content?.kill("SIGKILL");
      this.#background?.kill("SIGKILL");
    } catch (_) {
      // noop
    }
  }

  start() {
    setTimeout(() => {
      this.#start_();
    }, 1);

    return this;
  }

  async #start_() {
    // start our main streaming process. this is the ffmpeg process
    // that will intake UDP streams for
    // 1. the background
    // 2. audio stream

    const opts = {
      distributeUrl: this.input.distributeUrl,
      contentUdpUrl: this.input.contentUdpUrl,
    };

    let args: string[] = [];

    if (this.input.backgroundPath && isImage(this.input.backgroundPath)) {
      args = ffmpeg.distributeWithBackgroundImage({
        ...opts,
        background: this.input.backgroundPath,
      });
    } else if (this.input.backgroundPath || this.input.backgroundUdpUrl) {
      args = ffmpeg.distributeWithBackgroundInput({
        ...opts,
        background: (this.input.backgroundPath ?? this.input.backgroundUdpUrl)!,
      });
    }

    assert(args.length > 0, "Unable to get streaming args from input");

    this.#main = this.input.createProcess({
      bin: "ffmpeg",
      args,
    });

    // spawn in the background
    this.#main.spawn(true);

    // wait until the sub process launches
    while (isFalsy(this.#main?.child)) {
      await wait(100);
    }

    console.log("main process running. starting content");

    let nextStreamState = await this.input.loadNextSource({
      lastSource: null,
      nextSource: null,
      data: {},
    });

    console.log("next stream state", nextStreamState.nextSource);

    // now that the main stream process has started
    // lets start streaming our content to it
    while (nextStreamState.nextSource !== null) {
      const useBackground = nextStreamState.data.background;

      // if there's a unique background start the stream
      if (useBackground) {
        this.streamBackground(useBackground);
      }

      await this.streamContent(nextStreamState.nextSource);

      // ask for the next source
      // and pass the current state
      nextStreamState = await this.input.loadNextSource({
        lastSource: nextStreamState.nextSource,
        nextSource: null,
        data: nextStreamState.data,
      });

      // if there's a new background and it
      if (
        nextStreamState.data.background &&
        nextStreamState.data.background !== useBackground
      ) {
        this.#background?.kill("SIGKILL");
      }
    }

    // when we get here, we need to stop
    // the main stream
    this.stop();
  }

  streamBackground(filePath: string) {
    if (filePath && this.input.backgroundUdpUrl) {
      try {
        this.#background = this.input.createProcess({
          bin: "ffmpeg",
          args: ffmpeg.streamFileToUdp(
            {
              udpUrl: this.input.backgroundUdpUrl,
              filePath,
            },
            ["-an", "-c:v", "copy"],
            ["-stream_loop", "-1"],
          ),
        });

        this.#background.spawn(true);
      } catch (err) {
        console.log(
          "Error starting background stream:",
          (err as Error).message,
        );
      }
    }
  }

  async streamContent(filePath: string) {
    try {
      this.#content = this.input.createProcess({
        bin: "ffmpeg",
        args: ffmpeg.streamFileToUdp({
          udpUrl: this.input.contentUdpUrl,
          filePath,
        }, ["-vn", "-c:a", "copy"]),
      });

      this.#content.spawn();

      await this.#content.status();
    } catch (err) {
      console.log("Error starting content stream:", (err as Error).message);
    }
  }
}

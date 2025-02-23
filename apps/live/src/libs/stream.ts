import { isFalsy, isVideo, wait } from "./utils.ts";

import ffmpeg from "./ffmpeg.ts";
import { OutputLogger } from "./logger.ts";
import { assert } from "../deps.ts";
import type { Process, ProcessInput } from "./process.ts";

export type StreamBackground = Partial<{
  color: string;
  textColor: string;
  url: string;
  thumbnail_url: string;
  text: string;
}>;

export type StreamState = {
  nextSource: string | null;
  lastSource: string | null;
  data:
    & Record<string, string>
    & Partial<{
      background: StreamBackground;
    }>;
};

export type StreamLoadNextSourceFn = (
  state: StreamState,
) => Promise<StreamState>;
export type StreamCreateProcessFn = (input: ProcessInput) => Process;
export type StreamDownloadFileFn = (filePathOrUrl: string) => Promise<string>;

export type StreamInput = {
  createProcess: StreamCreateProcessFn;
  loadNextSource: StreamLoadNextSourceFn;
  downloadFile: StreamDownloadFileFn;
  distributeUrls: string[];
  backgroundUdpUrl: string;
  contentUdpUrl: string;
  backgroundFallback: StreamBackground;
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
      distributeUrls: this.input.distributeUrls,
      contentUdpUrl: this.input.contentUdpUrl,
    };

    const args = ffmpeg.distributeWithBackgroundInput({
      ...opts,
      background: this.input.backgroundUdpUrl,
    });

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
      const useBackground = nextStreamState.data.background_url ??
        this.input.backgroundFallback;

      // start the background stream. while this is await
      // the background stream is moved to the background after the
      // file content is loaded
      await this.streamBackground(useBackground);

      // start streaming this content
      // this will wait until the stream finishes before
      // fulfilling the promise
      await this.streamContent(nextStreamState.nextSource);

      // ask for the next source
      // and pass the current state
      nextStreamState = await this.input.loadNextSource({
        lastSource: nextStreamState.nextSource,
        nextSource: null,
        data: nextStreamState.data,
      });
    }

    // when we get here, we need to stop
    // the main stream
    this.stop();
  }

  async streamBackground(filePathOrUrl: string) {
    assert(
      filePathOrUrl,
      "No filePathOrUrl provided to Stream.streamBackground()",
    );

    console.log(`streamBackground(${filePathOrUrl})`);
    const filePath = await this.input.downloadFile(filePathOrUrl);

    // stop a stream if one is going
    if (this.#background) {
      this.#background.kill("SIGKILL");
    }

    try {
      const beforeOutputs = isVideo(filePathOrUrl)
        ? ["-stream_loop", "-1"]
        : ["-loop", "1"];

      beforeOutputs.push(
        "-vf",
        "drawtext=text='Hello, World!':fontsize=48:fontcolor=white:x=100:y=100",
      );

      this.#background = this.input.createProcess({
        bin: "ffmpeg",
        args: ffmpeg.streamFileToUdp(
          {
            udpUrl: this.input.backgroundUdpUrl,
            filePath,
          },
          ["-an", "-c:v", "copy"],
          beforeOutputs,
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

  async streamContent(filePathOrUrl: string) {
    assert(
      filePathOrUrl,
      "No filePathOrUrl provided to Stream.streamContent()",
    );

    const filePath = await this.input.downloadFile(filePathOrUrl);

    try {
      this.#content = this.input.createProcess({
        bin: "ffmpeg",
        args: ffmpeg.streamFileToUdp({
          udpUrl: this.input.contentUdpUrl,
          filePath,
        }, ["-vn", "-c:a", "copy"]),
      });

      this.#content.spawn();

      const { code } = await this.#content.status();

      // if the code is good, lets cleanup the cache file
      // since we don't need it anymore
      if (code === 0) {
        await Deno.remove(filePath);
      }
    } catch (err) {
      console.log("Error starting content stream:", (err as Error).message);
    }
  }
}

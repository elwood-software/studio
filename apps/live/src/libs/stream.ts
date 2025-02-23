import { isFalsy, isVideo, wait } from "./utils.ts";

import ffmpeg from "./ffmpeg.ts";
import { OutputLogger } from "./logger.ts";
import { assert } from "../deps.ts";
import type { Process, ProcessInput } from "./process.ts";
import type { JsonObject } from "../types.ts";

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
    & JsonObject
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

  async stop() {
    try {
      await Promise.all([
        this.#main?.kill("SIGKILL"),
        this.#content?.kill("SIGKILL"),
        this.#background?.kill("SIGKILL"),
      ]);
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

    //
    let nextStreamState = await this.input.loadNextSource({
      lastSource: null,
      nextSource: null,
      data: {},
    });

    assert(
      nextStreamState.nextSource,
      "First call to loadNextSource did not return a source",
    );

    // download the first source
    await this.input.downloadFile(nextStreamState.nextSource);

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
      loggerPrefix: "MAIN",
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
    console.log("first stream state", nextStreamState.nextSource);

    // now that the main stream process has started
    // lets start streaming our content to it
    while (nextStreamState.nextSource !== null) {
      const useBackground = nextStreamState.data.background ??
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

      console.log("next stream state", nextStreamState.nextSource);
    }

    // when we get here, we need to stop
    // the main stream
    await this.stop();
  }

  async streamBackground(options: StreamBackground) {
    // stop a stream if one is going
    if (this.#background) {
      await this.#background.kill("SIGTERM");
      await wait(1000 * 5);

      console.log("stopping last background", this.#background.result);
    }

    let args: string[] = [];

    if (options.url) {
      const filePath = await this.input.downloadFile(options.url);

      args = ffmpeg.streamFileToUdp(
        {
          udpUrl: this.input.backgroundUdpUrl,
          filePath,
        },
        ["-an", "-c:v", "copy"],
        isVideo(filePath) ? ["-stream_loop", "-1"] : ["-loop", "1"],
      );
    } else {
      args = ffmpeg.streamWithGeneratedBackgroundToUdp({
        udpUrl: this.input.backgroundUdpUrl,
        text: options.text ?? "#ffffff",
        backgroundColor: options.color ?? "#000000",
      });
    }

    try {
      this.#background = this.input.createProcess({
        loggerPrefix: "BACKGROUND",
        bin: "ffmpeg",
        args,
      });

      this.#background.spawn(true);

      // wait to make sure it has started
      while (isFalsy(this.#background?.child)) {
        await wait(100);
      }
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
        loggerPrefix: "CONTENT",
        bin: "ffmpeg",
        args: ffmpeg.streamFileToUdp({
          udpUrl: this.input.contentUdpUrl,
          filePath,
        }, ["-t", "60", "-vn", "-c:a", "copy"]),
      });

      this.#content.spawn();

      const { code } = await this.#content.status();

      // if the code is good, lets cleanup the cache file
      // since we don't need it anymore
      if (code === 0) {
        await Deno.remove(filePath);
      }

      await wait(1000);
    } catch (err) {
      console.log("Error starting content stream:", (err as Error).message);
    }
  }
}

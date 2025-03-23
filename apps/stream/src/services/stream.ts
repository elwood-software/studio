import { isFalsy, wait } from "../libs/utils.ts";
import ffmpeg from "./ffmpeg.ts";
import { OutputLogger } from "../libs/logger.ts";
import { assert, EventEmitter } from "../deps.ts";
import type { Process, ProcessInput } from "./process.ts";
import type { JsonObject, StreamBackground } from "../types.ts";
import { ffprobe } from "./ffprobe.ts";

export type StreamState = {
  nextSource: string | null;
  lastSource: string | null;
  data:
    & JsonObject
    & Partial<{
      start: string;
      stop: string;
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
  contentUdpUrl: string;
  backgroundFallback: StreamBackground;
};

export type StreamEvents = {
  init: [];
  "start": [];
  "stop": [];
  "change": [{
    next: StreamState;
    prev: StreamState;
  }];
};

export class Stream extends EventEmitter<StreamEvents> {
  readonly id: string;

  #main: Process | null = null;
  #content: Process | null = null;

  constructor(private readonly input: StreamInput) {
    super();
    this.id = crypto.randomUUID();
    this.emit("init");
  }

  get logs(): {
    main?: OutputLogger;
    content?: OutputLogger;
  } {
    return {
      main: this.#main?.logger,
      content: this.#content?.logger,
    };
  }

  async stop() {
    try {
      await Promise.all([
        this.#main?.kill("SIGKILL"),
        this.#content?.kill("SIGKILL"),
      ]);
    } catch (_) {
      // noop
    }

    this.emit("stop");
  }

  start() {
    setTimeout(() => {
      this.#start_();
    }, 1);

    return this;
  }

  async #start_() {
    this.emit("start");

    // start our main streaming process. this is the ffmpeg process
    // that will intake UDP streams for
    // 1. the background
    // 2. audio stream

    // start by getting the first source file
    let currentStreamState = await this.input.loadNextSource({
      lastSource: null,
      nextSource: null,
      data: {},
    });

    assert(
      currentStreamState.nextSource,
      "First call to loadNextSource did not return a source",
    );

    // download the first source in the foreground
    // so we know it's available
    await this.#preload(currentStreamState, false);

    const args = ffmpeg.distributeWithArgs({
      distributeUrls: this.input.distributeUrls,
      contentUdpUrl: this.input.contentUdpUrl,
      background: this.input.backgroundFallback,
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
    console.log("first stream state", currentStreamState.nextSource);

    // now that the main stream process has started
    // lets start streaming our content to it
    while (currentStreamState.nextSource !== null) {
      // get the next stream state right away so we can preload it
      const nextStreamState = await this.input.loadNextSource({
        lastSource: currentStreamState.nextSource,
        nextSource: null,
        data: currentStreamState.data,
      });

      // lets preload the next stream state, if there is one
      this.#preload(nextStreamState);

      // start streaming this content
      // this will wait until the stream finishes before
      // fulfilling the promise
      await this.streamContent(
        currentStreamState,
      );

      this.emit("change", {
        next: nextStreamState,
        prev: currentStreamState,
      });

      // ask for the next source
      // and pass the current state
      currentStreamState = nextStreamState;

      console.log("next stream state", nextStreamState.nextSource);
    }

    // when we get here, we need to stop
    // the main stream
    await this.stop();
  }

  async #preload(state: StreamState, background = true) {
    if (background === false) {
      await this.#_preload(state);
      return;
    }

    setTimeout(async () => {
      await this.#_preload(state);
    }, 1);
  }

  async #_preload(state: StreamState) {
    if (state.nextSource === null) {
      return;
    }

    // download the file and generate a probe result
    await ffprobe(await this.input.downloadFile(state.nextSource));

    // if there's a background url, lets download that too
    if (state.data.background?.url) {
      await this.input.downloadFile(state.nextSource);
    }
  }

  async streamContent(
    state: StreamState,
  ) {
    assert(
      state,
      "No state provided to Stream.streamContent()",
    );

    assert(
      state.nextSource,
      "No nextSource provided to Stream.streamContent()",
    );

    try {
      const filePath = await this.input.downloadFile(state.nextSource);
      const { duration } = await ffprobe(filePath) ?? { duration: 0 };

      const args = ffmpeg.streamWithGeneratedBackgroundToUdp({
        backgroundColor: state.data.background?.color!,
        text: state.data.background?.text!,
        udpUrl: this.input.contentUdpUrl,
        filePath,
        fadeLength: 5,
        length: 30,
        duration,
      });

      this.#content = this.input.createProcess({
        loggerPrefix: "CONTENT",
        bin: "ffmpeg",
        args,
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

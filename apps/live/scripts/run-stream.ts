import * as dotenv from "jsr:@std/dotenv";

import { getPort, join } from "../src/deps.ts";
import { Stream } from "../src/libs/stream.ts";
import { Process } from "../src/libs/process.ts";

await dotenv.load({
  envPath: join(import.meta.dirname!, "../../../.env"),
  export: true,
});

console.log(Deno.env.get("STREAM_KEY"));

const contentPort = await getPort();
const backgroundPort = await getPort({
  exclude: [contentPort],
});

const stream = new Stream({
  createProcess(input) {
    const proc = new Process(input);
    proc.logger.writeToConsole = true;
    return proc;
  },
  distributeUrl: Deno.env.get("STREAM_KEY")!,
  contentUdpUrl: `udp://0.0.0.0:${contentPort}`,
  backgroundUdpUrl: `udp://0.0.0.0:${backgroundPort}`,
  async loadNextSource(state) {
    return await Promise.resolve(
      state.lastSource !== null
        ? {
          ...state,
          nextSource: null,
        }
        : {
          ...state,
          data: {
            background: join(import.meta.dirname!, "../fixtures/video.mp4"),
          },
          nextSource: join(import.meta.dirname!, "../fixtures/audio.mp3"),
        },
    );
  },
});

stream.start();

Deno.addSignalListener("SIGINT", () => {
  stream.stop();

  Deno.exit();
});

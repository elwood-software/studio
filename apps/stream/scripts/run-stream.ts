import * as dotenv from "jsr:@std/dotenv";

import { getPort, join } from "../src/deps.ts";
import { Stream } from "../src/services/stream.ts";
import { Process } from "../src/services/process.ts";
import { fs } from "../src/services/fs.ts";
import { isFalsy } from "../src/libs/utils.ts";

await dotenv.load({
  envPath: join(import.meta.dirname!, "../../../.env"),
  export: true,
});

console.log(Deno.env.get("STREAM_KEY"));

const contentPort = await getPort();
const backgroundPort = await getPort({
  exclude: [contentPort],
});
const outPort = await getPort({
  exclude: [contentPort, backgroundPort],
});

const sources = [
  {
    url:
      "https://dts.podtrac.com/redirect.mp3/tracking.swap.fm/track/0bDcdoop59bdTYSfajQW/arttrk.com/p/ST44R/pdrl.fm/f3efd0/claritaspod.com/measure/stitcher.simplecastaudio.com/c945bd13-c7f3-4f22-95b5-4bf98e12b21f/episodes/98e54b5e-daa6-4d99-9aa1-3e7fd4a7cc8d/audio/128/default.mp3?aid=rss_feed&awCollectionId=c945bd13-c7f3-4f22-95b5-4bf98e12b21f&awEpisodeId=98e54b5e-daa6-4d99-9aa1-3e7fd4a7cc8d&feed=dHoohVNH",
    background: {
      color: "black",
      text: "CONAF -- source 1 ",
    },
  },
  {
    url:
      "https://dts.podtrac.com/redirect.mp3/tracking.swap.fm/track/0bDcdoop59bdTYSfajQW/stitcher.simplecastaudio.com/f2f1dde5-76b4-4720-b168-c990ca3e6f26/episodes/2c99d400-3762-4ae1-9a31-fee5f79bcb2e/audio/128/default.mp3?aid=rss_feed&awCollectionId=f2f1dde5-76b4-4720-b168-c990ca3e6f26&awEpisodeId=2c99d400-3762-4ae1-9a31-fee5f79bcb2e&feed=0T4plG50",
    background: {
      color: "green",
      text: "WEKYN -- source 2",
    },
  },
];

const stream = new Stream({
  downloadFile(filePathOrUrl: string) {
    return fs.download({
      storageDir: join(import.meta.dirname!, "../../../tmp"),
      src: filePathOrUrl,
    });
  },
  createProcess(input) {
    const proc = new Process(input);
    proc.logger.writeToConsole = true;
    return proc;
  },
  backgroundFallback: {},
  distributeUrls: [
    `udp://0.0.0.0:${outPort}`,
    // Deno.env.get("STREAM_KEY")!,
  ],
  contentUdpUrl:
    `udp://0.0.0.0:${contentPort}?overrun_nonfatal=1&fifo_size=100000000&buffer_size=10485760`,

  async loadNextSource(state) {
    let idx = state.data.idx;

    if (!state.lastSource) {
      idx = -1;
    }

    const nxtIdx = idx + 1;
    const nxt = sources[nxtIdx];

    if (!nxt) {
      return {
        ...state,
        nextSource: null,
      };
    }

    return await Promise.resolve(
      {
        ...state,
        data: {
          idx: nxtIdx,
          ...nxt,
        },
        nextSource: nxt.url,
      },
    );
  },
});

console.log("out", `udp://0.0.0.0:${outPort}`);

stream.start();

Deno.addSignalListener("SIGINT", () => {
  stream.stop();

  Deno.exit();
});

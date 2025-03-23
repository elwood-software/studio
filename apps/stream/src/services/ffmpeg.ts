import type { StreamBackground } from "../types.ts";

export type DistributeOptions = {
  background: StreamBackground;
  contentUdpUrl: string;
  distributeUrls: string[];
};

export type StreamFileToUdpOptions = {
  udpUrl: string;
  filePath: string;
};

function $if(val: unknown, args: Array<string | number>): string[] {
  return val ? args.map(String) : [];
}

function escape(text: string): string {
  return text.replaceAll(":", "\:")
    .replaceAll("'", '"')
    .replaceAll("%", "%%")
    .replaceAll("=", "\=")
    .replaceAll("[", "\[")
    .replaceAll("]", "\]")
    .replaceAll(",", "\,")
    .replaceAll(
      "\\",
      "\\\\",
    );
}

export function distributeWithArgs(
  options: DistributeOptions,
): string[] {
  const isRtmp = options.distributeUrls[0].startsWith("rtmp:");

  return [
    "-f",
    "lavfi",
    "-i",
    "color=c=black:s=1920x1080:r=30",
    "-fflags",
    "+genpts",
    "-re",
    "-i",
    options.contentUdpUrl,
    "-filter_complex",
    "[1:v]scale=1920:1080[vid];[0:v][vid]overlay=(W-w)/2:(H-h)/2[outv]",
    "-map",
    "[outv]",
    "-map",
    "1:a?",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-b:v",
    "3M",
    "-maxrate",
    "3M",
    "-bufsize",
    "6M",
    "-c:a",
    "aac",
    "-b:a",
    "6800k",
    "-shortest",
    ...(isRtmp ? ["-f", "flv"] : ["-f", "mpegts"]),
    ...options.distributeUrls,
  ];

  // return [
  //   "-hide_banner",
  //   "-loglevel",
  //   "info",
  //   "-y",
  //   "-fflags",
  //   "+genpts",
  //   // "-avioflags",
  //   // "direct",
  //   // "-reorder_queue_size",
  //   // "10000",
  //   // "-analyzeduration",
  //   // "10000000",
  //   // "-probesize",
  //   // "10000000",
  //   // ...args,
  //   "-i",
  //   options.contentUdpUrl,
  //   "-fflags",
  //   "+genpts",
  //   "-filter_complex",
  //   "[1:a]showwaves=s=1920x300:colors=0xffffff:mode=line:draw=full,format=rgba[v];[0:v][v]overlay=0:780[outv]",
  //   "-map",
  //   "[outv]",
  //   "-map",
  //   "1:a",
  //   "-c:v",
  //   "libx264",
  //   "-preset",
  //   "veryfast",
  //   "-b:v",
  //   "4000k",
  //   "-c:a",
  //   "aac",
  //   "-b:a",
  //   "6800k",
  //   "-shortest",
  //   "-f",
  //   "flv",
  //   // "-f",
  //   // "mpegts",
  //   ...options.distributeUrls,
  // ];
}

export function streamFileToUdp(
  options: StreamFileToUdpOptions,
  beforeOutput = ["-c", "copy"],
  beforeInput: string[] = [],
): string[] {
  return [
    // "-hide_banner",
    // "-loglevel",
    // "info",
    ...beforeInput,
    "-re",
    "-i",
    options.filePath,
    ...beforeOutput,
    "-f",
    "mpegts",
    options.udpUrl,
  ];
}

export type StreamWithGeneratedBackgroundToUdpOptions =
  & StreamFileToUdpOptions
  & {
    text: string;
    backgroundColor: string;
    duration?: number | string;
    length?: string | number;
    fadeLength?: string | number;
    thumbnailFile?: string;
  };

export function streamWithGeneratedBackgroundToUdp(
  options: StreamWithGeneratedBackgroundToUdpOptions,
) {
  const fadeLength_ = options.fadeLength
    ? parseInt(String(options.fadeLength), 10)
    : 5;
  const duration_ = options.duration
    ? parseInt(String(options.duration), 10)
    : undefined;

  const videoFilter = [
    "format=rgba",
    ...$if(duration_, [
      `fade=t=in:st=0:d=${fadeLength_}:alpha=1`,
    ]),
    ...$if(duration_, [
      `fade=t=out:st=${duration_! - fadeLength_}:d=${fadeLength_}:alpha=1`,
    ]),
    `drawtext=text='${
      escape(options.text)
    }':fontsize=48:fontcolor=white:x=400:y=500`,
  ].join(",");

  const audioFilter = [
    ...$if(duration_, [
      `afade=t=in:st=0:d=${fadeLength_}`,
    ]),
    ...$if(duration_, [
      `afade=t=out:st=${duration_}:d=${fadeLength_}`,
    ]),
  ].join(",");

  return [
    "-hide_banner",
    "-loglevel",
    "info",
    "-f",
    "lavfi",
    "-i",
    `color=c=${options.backgroundColor}:s=1920x1080`,
    "-re",
    "-i",
    options.filePath,
    "-filter_complex",
    [
      `[0:v]${videoFilter}[vtext]`,
      `[1:a]${audioFilter}[aud]`,
      `[aud]showwaves=s=1920x300:colors=0xffffff:mode=line:draw=full,format=rgba[vwaves]`,
      `[vtext][vwaves]overlay=0:H-300[outv]`,
    ].join(";"),
    ...$if(options.length, ["-t", options.length!]),
    "-map",
    "[outv]",
    "-map",
    "1:a?",
    "-f",
    "mpegts",
    options.udpUrl,
  ];
}

export default {
  streamFileToUdp,
  distributeWithArgs,
  streamWithGeneratedBackgroundToUdp,
};

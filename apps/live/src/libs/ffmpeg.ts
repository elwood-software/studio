export type DistributeOptions = {
  background: string;
  contentUdpUrl: string;
  distributeUrls: string[];
};

export type StreamFileToUdpOptions = {
  udpUrl: string;
  filePath: string;
};

export function distributeWithBackgroundInput(
  options: DistributeOptions,
): string[] {
  return distributeWithArgs(options, [
    "-re",
    "-i",
    options.background,
  ]);
}

export function distributeWithArgs(
  options: DistributeOptions,
  args: string[],
): string[] {
  return [
    // "-hide_banner",
    // "-loglevel",
    // "info",
    "-y",
    "-fflags",
    "+genpts",
    // "-avioflags",
    // "direct",
    // "-reorder_queue_size",
    // "10000",
    // "-analyzeduration",
    // "10000000",
    // "-probesize",
    // "10000000",
    ...args,
    "-i",
    options.contentUdpUrl,
    "-fflags",
    "+genpts",
    "-filter_complex",
    "[1:a]showwaves=s=1920x300:colors=0xffffff:mode=line:draw=full,format=rgba[v];[0:v][v]overlay=0:780[outv]",
    "-map",
    "[outv]",
    "-map",
    "1:a",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-b:v",
    "4000k",
    "-c:a",
    "aac",
    "-b:a",
    "6800k",
    "-shortest",
    "-f",
    "flv",
    // "-f",
    // "mpegts",
    ...options.distributeUrls,
  ];
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
  & Omit<StreamFileToUdpOptions, "filePath">
  & {
    text: string;
    backgroundColor: string;
  };

export function streamWithGeneratedBackgroundToUdp(
  options: StreamWithGeneratedBackgroundToUdpOptions,
) {
  return [
    "-hide_banner",
    "-loglevel",
    "info",
    "-f",
    "lavfi",
    "-i",
    `color=c=${options.backgroundColor}:s=1920x1080`,
    // "-i",
    // options.filePath,
    "-filter_complex",
    [
      `drawtext=text='${options.text}':fontsize=48:fontcolor=white:x=400:y=500`,
    ].join(","),
    "-f",
    "mpegts",
    options.udpUrl,
  ];
}

export default {
  streamFileToUdp,
  distributeWithArgs,
  distributeWithBackgroundInput,
  streamWithGeneratedBackgroundToUdp,
};

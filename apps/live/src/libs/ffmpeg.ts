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
    "-hide_banner",
    "-loglevel",
    "info",
    "-y",
    ...args,
    "-re",
    "-i",
    options.contentUdpUrl,
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
    ...options.distributeUrls,
  ];
}

export function streamFileToUdp(
  options: StreamFileToUdpOptions,
  beforeOutput = ["-c", "copy"],
  beforeInput: string[] = [],
): string[] {
  return [
    "-hide_banner",
    "-loglevel",
    "info",
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

export type StreamWithImageToUdpOptions = StreamFileToUdpOptions & {
  text: string;
  backgroundColor: string;
};

export function streamWithImageToUdp(options: StreamWithImageToUdpOptions) {
  return [
    "-hide_banner",
    "-loglevel",
    "info",
    "-f",
    "lavfi",
    "-i",
    `color=c=${options.backgroundColor}:s=1920x1080`,
    "-i",
    options.filePath,
    "-filter_complex",
    [
      "[0:v][1:v] overlay=200:150",
      `drawtext=text='Hello, World!':fontsize=48:fontcolor=white:x=400:y=500`,
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
};

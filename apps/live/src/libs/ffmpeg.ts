export type DistributeOptions = {
  background: string;
  contentUdpUrl: string;
  distributeUrl: string;
};

export type StreamFileToUdpOptions = {
  udpUrl: string;
  filePath: string;
};

export function distributeWithBackgroundImage(options: DistributeOptions) {
  return distributeWithArgs(options, [
    "-loop",
    "1",
    "-i",
    options.background,
  ]);
}

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
    options.distributeUrl,
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

export default {
  streamFileToUdp,
  distributeWithArgs,
  distributeWithBackgroundImage,
  distributeWithBackgroundInput,
};

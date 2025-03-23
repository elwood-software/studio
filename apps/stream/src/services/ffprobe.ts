import { Process } from "./process.ts";
import type { JsonObject } from "../types.ts";
import { exists } from "../deps.ts";

const POSTFIX = ".ffprobe.txt";

export type ProbeOutput = {
  duration: number;
  output: JsonObject;
};

export async function ffprobe(filePath: string): Promise<ProbeOutput | null> {
  const cacheFile = `${filePath}${POSTFIX}`;

  // check if there's a cache file
  if (await exists(cacheFile)) {
    try {
      return JSON.parse(await Deno.readTextFile(cacheFile));
    } catch (_) {
      // noop
    }
  }

  const proc = new Process({
    bin: "ffprobe",
    args: [
      "-v",
      "quiet",
      "-print_format",
      "json",
      "-show_format",
      "-show_streams",
      filePath,
    ],
  });

  const { code } = await proc.spawn().status();

  if (code === 0) {
    try {
      const output = JSON.parse(
        proc.stdout.map((item) => item.text).join(""),
      ) as JsonObject;

      const data = {
        duration: parseInt(output.format.duration),
        output,
      };

      await Deno.writeTextFile(cacheFile, JSON.stringify(data));

      return data;
    } catch (_) {
      //noop
    }
  }

  return null;
}

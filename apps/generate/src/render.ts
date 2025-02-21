import { renderVideo } from "@revideo/renderer";

import { extractColors } from "extract-colors";
import getPixels from "get-pixels";
import type { NdArray } from "ndarray";

async function render() {
  console.log("Rendering video...");

  const variables = await createVariables({
    thumbnailUrl:
      "https://image.simplecastcdn.com/images/6b2861f6-d7ec-4f88-bc67-43748d98bfbd/aabeb0e0-3dd5-464f-aac3-e551be84b94a/3000x3000/conanneedsafriend-keyartupdate-3000x3000.jpg?aid=rss_feed",
  });

  // This is the main function that renders the video
  const file = await renderVideo({
    projectFile: "./src/projects/podcast-1.tsx",
    variables,
    settings: {
      logProgress: true,
      ffmpeg: {
        ffmpegPath: "/usr/local/bin/ffmpeg",
        ffprobePath: "/usr/local/bin/ffprobe",
      },
    },
  });

  console.log(`Rendered video to ${file}`);
}

render();

export type CreateVariablesInput = {
  thumbnailUrl: string;
};
export async function createVariables(
  input: CreateVariablesInput,
): Promise<Record<string, string>> {
  const out = await new Promise<NdArray<Uint8Array>>((resolve) =>
    getPixels(input.thumbnailUrl, (err, pixels) => resolve(pixels))
  );

  const colors = await extractColors({
    data: [...out.data],
    width: out.shape[0],
    height: out.shape[1],
  });

  return {
    thumbnailUrl: input.thumbnailUrl,
    backgroundColor: colors[0].hex,
  };
}

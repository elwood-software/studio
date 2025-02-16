import { renderVideo } from "@revideo/renderer";

async function render() {
  console.log("Rendering video...");

  // This is the main function that renders the video
  const file = await renderVideo({
    projectFile: "./project.tsx",
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

import { renderVideo } from "@revideo/renderer";

import * as path from "node:path";
import * as fs from "node:fs";
import express from "express";

const ffmpeg = process.env.FFMPEG_PATH ?? "/usr/local/bin/ffmpeg";
const ffprobe = process.env.FFMPROBE_PATH ?? "/usr/local/bin/ffprobe";
const varDir = process.env.VAR_DIR ?? "/tmp";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).send(`:)`);
});

app.post("/render", async (req, res) => {
  try {
    const { id, variables } = req.body;

    const outputFilePath = path.join(varDir, `./${id}.mp4`);

    if (fs.existsSync(outputFilePath)) {
      res.sendFile(outputFilePath);
      return;
    }

    console.log("Rendering video...");
    await renderVideo({
      projectFile: "./src/project.tsx",
      variables,
      settings: {
        outDir: varDir,
        outFile: `${id}.mp4`,
        logProgress: true,
        ffmpeg: {
          ffmpegPath: ffmpeg,
          ffprobePath: ffprobe,
        },
      },
    });
    console.log("Finished rendering");

    res.json({
      ok: true,
      exists: fs.existsSync(outputFilePath),
    });
  } catch (err) {
    console.error("Error rendering video:", err);
    res.status(500).send("Error rendering video");
  }
});

app.get("/view/:id", async (req, res) => {
  const { id } = req.params;
  const outputFilePath = path.join(varDir, `./${id}.mp4`);

  if (fs.existsSync(outputFilePath)) {
    res.sendFile(outputFilePath);
    return;
  }

  res.status(500).send("Error rendering video");
});

const port = parseInt(process.env.PORT ?? "3000", 10);

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});

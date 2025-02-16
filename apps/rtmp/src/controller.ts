import { createServer } from "node:http";

const hostname = "0.0.0.0";
const port = Number(process.env.PORT ?? "3000");
const bucketName = process.env.BUCKET_NAME;
const watchFolder = process.env.APOLLO_STREAMS_DIR ?? "/tmp/streams";

console.log(`Port: ${port}`);
console.log(`Bucket Name: ${bucketName}`);
console.log(`Watch Folder: ${watchFolder}`);
console.log(`Key: ${process.env.STREAM_KEY}`);

const server = createServer((req, res) => {
  console.log("request", req.url);

  const [_, queryParams] = req.url!.split("?");
  const params = new URLSearchParams(queryParams);

  const key = params.get("key");
  const app = params.get("name");
  const plain = params.get("plain") === "true";

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain");

  const args = [
    "-y",
    "-re",
    "-i",
    `rtmp://0.0.0.0:1935/${app}/${key}`,
    "-i",
    "udp://localhost:8088",
    "-filter_complex",
    '"[0:a]aformat=channel_layouts=mono,showwaves=s=1920x300:colors=0xffffff:mode=line,format=rgba[v];[1:v][v]overlay=0:780[outv]"',
    "-map",
    '"[outv]"',
    "-map",
    "0:a",
    "-c:v",
    "libx264",
    "-c:a",
    "aac",
    "-f",
    "flv",
  ];

  res.end(`ffmpeg ${args.join(" ")} ${process.env.STREAM_KEY}`);
});

server.listen(port, hostname, () => {
  log(`Server running at http://${hostname}:${port}/`);
});

function log(...msg: string[]) {
  msg.forEach((line) => process.stdout.write(`${line}\n`));
}

import { createServer } from "node:http";

const hostname = "0.0.0.0";
const port = Number(process.env.PORT ?? "3000");
const streamPort = Number(process.env.STREAM_PORT ?? "1935");

console.log(`Port: ${port}`);
console.log(`Stream Port: ${streamPort}`);
console.log(`Key: ${process.env.STREAM_KEY}`);

const server = createServer((req, res) => {
  console.log("request", req.url);

  const [_, queryParams] = req.url!.split("?");
  const params = new URLSearchParams(queryParams);

  const key = params.get("key")!;
  const app = params.get("name");

  // unpack the key to get a list of places we want to
  // restream to
  const { dest } = JSON.parse(Buffer.from(key, "base64url").toString());

  console.log(dest);

  if (!Array.isArray(dest)) {
    throw new Error("Missing dest array");
  }

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain");

  const args = [
    "-y",
    "-i",
    `rtmp://localhost/${app}/${key}?loopback`,
    "-c",
    "copy",
    "-f",
    "flv",
    ...dest,
  ];

  console.log(`ffmpeg ${args.join(" ")}`);

  res.end(`ffmpeg ${args.join(" ")}`);
});

server.listen(port, hostname, () => {
  log(`Server running at http://${hostname}:${port}/`);
});

function log(...msg: string[]) {
  msg.forEach((line) => process.stdout.write(`${line}\n`));
}

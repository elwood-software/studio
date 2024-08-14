import { ensureDir } from "jsr:@std/fs@1.0.1";
import { basename, dirname, join } from "jsr:@std/path";
import { default as slug } from "npm:slug";
import { stringify } from "@std/yaml";

import { parseFeed } from "jsr:@mikaelporttila/rss@*";

const __dirname = new URL(".", import.meta.url).pathname;

const feed = await parseFeed(
  await (await fetch("https://podcastfeeds.nbcnews.com/_sWHkul5")).text(),
);

const rootName = slug(feed.title.value?.slice(0, 50));
const rootPath = join(__dirname, rootName);

await ensureDir(rootPath);

Deno.writeTextFileSync(
  join(rootPath, "node.yaml"),
  stringify({
    type: "TREE",
    category: "SHOW",
    name: rootName,
    content: {
      title: feed.title.value,
      description: feed.description ?? "",
      language: feed.language,
      image: {
        url: feed.image?.url ?? "",
        title: feed.image?.title ?? "",
        link: feed.image?.link ?? "",
      },
    },
  }),
);

if (feed.image?.url) {
  await download(feed.image!.url, join(rootPath, "artwork.jpg"));
}

await Promise.all(
  feed.entries.slice(0, 1).map(async (item, idx) => {
    const itemName = slug(item.title?.value);
    const itemPath = join(rootPath, itemName);
    const enclosure = item.attachments?.[0];

    await ensureDir(itemPath);

    Deno.writeTextFileSync(
      join(itemPath, "node.yaml"),
      stringify({
        type: "TREE",
        category: "EPISODE",
        name: itemName,
        content: {
          number: idx + 1,
          id: item.id,
          published: item.published?.toISOString(),
          title: item.title?.value ?? "",
          description: item.description?.value ?? "",
          enclosure,
          content: item.content?.value ?? "",
        },
      }),
    );

    if (enclosure?.url) {
      await download(enclosure.url, join(itemPath, "public.mp3"));
    }

    await generateVideo(
      `[PUBLIC] ${item.title?.value}`,
      join(itemPath, "public.mp4"),
      enclosure?.url ? join(itemPath, "public.mp3") : undefined,
    );

    await generateVideo(
      `[PRIVATE] ${item.title?.value}`,
      join(itemPath, "private.mp4"),
      enclosure?.url ? join(itemPath, "public.mp3") : undefined,
    );

    await generatePrivateAudio(
      `Private audio for episode titled ${item.title?.value} of ${feed.title.value}`,
      join(itemPath, "private.m4a"),
    );
  }),
);

export async function download(from: string, to: string) {
  console.log(`Downloading ${from} to ${to}`);

  (await fetch(from)).body?.pipeTo(
    (await Deno.open(to, { write: true, create: true }))
      .writable,
  );
}

export async function generateVideo(
  text: string,
  dest: string,
  audioFile: string | undefined = undefined,
) {
  const tempFilePath = await Deno.makeTempFile();

  await Deno.writeTextFile(tempFilePath, `${text} | %{localtime\:%X}`);

  const cmd = new Deno.Command("ffmpeg", {
    cwd: dirname(dest),
    args: [
      "-y",
      "-re",
      "-f",
      "lavfi",
      "-i",
      `smptehdbars=rate=30:size=1920x1080`,
      ...(audioFile
        ? [
          "-ss",
          "85",
          "-i",
          audioFile,
        ]
        : [
          "-f",
          "lavfi",
          "-i",
          "sine=frequency=1000:sample_rate=48000",
        ]),

      "-t",
      "6",
      "-vf",
      `drawtext='textfile=${tempFilePath}:rate=30:x=(w-tw)/2:y=(h-lh)/2:fontsize=48:fontcolor=white:box=1:boxcolor=black'`,
      "-c",
      "copy",
      "-map",
      "0:v:0",
      "-map",
      "1:a:0",
      "-c:v",
      "h264",
      "-pix_fmt",
      "yuv420p",
      "-preset",
      "ultrafast",
      "-c:a",
      "aac",
      "-shortest",
      basename(dest),
    ],
  });

  const _o = await cmd.output();

  console.log(new TextDecoder().decode(_o.stderr));

  await Deno.remove(tempFilePath);
}

export async function generatePrivateAudio(text: string, dest: string) {
  const tempFilePath = await Deno.makeTempFile();

  await Deno.writeTextFile(tempFilePath, `${text} `);

  const cmd = new Deno.Command("say", {
    cwd: dirname(dest),
    args: [
      "-f",
      tempFilePath,
      "-o",
      basename(dest),
    ],
  });

  const o = await cmd.output();

  console.log(new TextDecoder().decode(o.stderr));

  await Deno.remove(tempFilePath);
}

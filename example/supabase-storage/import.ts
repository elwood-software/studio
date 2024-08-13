import { ensureDir } from "jsr:@std/fs@1.0.1";
import { join } from "jsr:@std/path";
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

await Promise.all(feed.entries.map(async (item, idx) => {
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
    await download(enclosure.url, join(itemPath, "free.mp3"));
  }
}));

export async function download(from: string, to: string) {
  console.log(`Downloading ${from} to ${to}`);

  (await fetch(from)).body?.pipeTo(
    (await Deno.open(to, { write: true, create: true }))
      .writable,
  );
}

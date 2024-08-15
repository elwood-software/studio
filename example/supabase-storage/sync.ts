import { expandGlob, WalkEntry } from "jsr:@std/fs/expand-glob";
import { join, relative } from "jsr:@std/path";
import * as supabase from "jsr:@supabase/supabase-js";
import { contentType } from "jsr:@std/media-types";
import { extname } from "@std/path";
import { existsSync } from "jsr:@std/fs";

const client = supabase.createClient(
  "http://127.0.0.1:54321",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU",
  {
    global: {
      headers: {
        Authorization:
          `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU`,
      },
    },
  },
);

if (Deno.args.length === 0) {
  Deno.stdout.write(new TextEncoder().encode("Usage: sync.ts <directory>\n"));
  Deno.exit(0);
}

const __dirname = new URL(".", import.meta.url).pathname;
const root = join(__dirname, Deno.args[0]);

// see if there's a config locally
const possibleConfig = await Array.fromAsync(
  expandGlob("configure.*", { root: __dirname }),
);

if (possibleConfig.length > 0) {
  await upload(possibleConfig[0]);
}

await walk(root);

async function walk(dir: string) {
  const children = await Array.fromAsync(
    expandGlob("*", { root: dir, includeDirs: true, exclude: [".DS_Store"] }),
  );

  const node = children.find((file) => file.name.startsWith("node."));

  // always start with the node
  if (node) {
    console.log(`insert ${relative(root, node.path)}`);
    await upload(node);
  }

  // then do other files
  for await (const child of children) {
    if (child.isFile && !child.name.startsWith("node.")) {
      console.log(`insert ${relative(root, child.path)}`);
      await upload(child);
    }
  }

  // now children
  await Promise.all(
    children.filter((child) => child.isDirectory).map(async (child) =>
      await walk(child.path)
    ),
  );
}

async function upload(entry: WalkEntry) {
  const { data } = await client.storage.from("podcasts").createSignedUploadUrl(
    relative(__dirname, entry.path),
    {
      upsert: true,
    },
  );

  if (!data?.signedUrl) {
    throw new Error("No signed URL");
  }

  const handle = await Deno.open(entry.path, { read: true });

  await client.storage.from("podcasts").upload(
    relative(__dirname, entry.path),
    handle.readable,
    {
      upsert: true,
      contentType: contentType(extname(entry.path)) ??
        "application/octet-stream",
    },
  );

  await new Promise((resolve) => setTimeout(resolve, 500));
}

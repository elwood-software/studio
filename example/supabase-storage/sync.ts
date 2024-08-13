import { expandGlob } from "jsr:@std/fs/expand-glob";
import { join, relative } from "jsr:@std/path";
import * as supabase from "jsr:@supabase/supabase-js";
import { contentType } from "jsr:@std/media-types";
import { extname } from "@std/path";
import { decode } from "npm:base64-arraybuffer";

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

const __dirname = new URL(".", import.meta.url).pathname;
const root = join(__dirname, Deno.args[0]);

const rootNode = await Array.fromAsync(expandGlob("node.*", { root }));

if (rootNode.length === 0) {
  console.error("Root node not found");
  Deno.exit(1);
}

await client.storage.from("podcasts").upload(
  relative(__dirname, rootNode[0].path),
  Deno.readTextFileSync(rootNode[0].path),
);

const nodes = await Array.fromAsync(expandGlob("**/node.*", { root }));

for (const node of nodes) {
  await client.storage.from("podcasts").upload(
    relative(__dirname, node.path),
    Deno.readTextFileSync(node.path),
  );
}

// now everything that isn't a ndoe
const other = await Array.fromAsync(
  expandGlob("**/*", { root, includeDirs: false, exclude: ["**/node.*"] }),
);

for (const item of other) {
  await client.storage.from("podcasts").upload(
    relative(__dirname, item.path),
    Deno.readFileSync(item.path),
    {
      contentType: contentType(extname(item.path)),
      upsert: true,
    },
  );
}

import * as url from "node:url";

import {
  assert,
  encodeHex,
  exists,
  extname,
  join,
  toFileUrl,
} from "../deps.ts";
import { isHttpUrl } from "../libs/utils.ts";

export const fs = {
  download,
};

export type FetchInput = {
  storageDir: string;
  src: string;
};

export async function download(input: FetchInput): Promise<string> {
  assert(input.src, "No source provided to download()");
  assert(input.storageDir, "No storageDir provided to download()");

  const url = isHttpUrl(input.src) ? new URL(input.src) : toFileUrl(input.src);
  const cid = await createUrlCacheId(url);
  const storagePath = join(input.storageDir, `${cid}${extname(url.pathname)}`);

  if (!await exists(storagePath)) {
    switch (url.protocol) {
      case "file:": {
        assert(await exists(url), `Unable to copy file from "${url}"`);
        await Deno.copyFile(url, storagePath);
        assert(
          await exists(storagePath),
          `File not copied to "${storagePath}"`,
        );
        break;
      }
      default: {
        const resp = await fetch(url);
        const file = await Deno.open(storagePath, {
          write: true,
          create: true,
        });

        await resp.body!.pipeTo(file.writable);
      }
    }
  }

  assert(await exists(storagePath), `Unable to download to ${storagePath}`);

  return storagePath;
}

export async function createUrlCacheId(src: URL) {
  return encodeHex(
    await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(url.format(src).trim().toLowerCase()),
    ),
  );
}

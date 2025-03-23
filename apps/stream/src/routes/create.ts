import { Context, getPort, join, z, zValidator } from "../deps.ts";
import { base64UrlEncode } from "../libs/utils.ts";

import { Stream } from "../services/stream.ts";
import state from "../libs/state.ts";
import { Process } from "../services/process.ts";
import { fs } from "../services/fs.ts";
import { loadNextSourceProvider } from "../libs/load-next-source.ts";

import { create as schema } from "./schema.ts";

export const validators = [
  zValidator(
    "json",
    schema.json,
  ),
];

export async function handler(c: Context) {
  const { apiCallbackUrl } = c.var;
  const {
    id,
    playlist,
    start,
    fallback_background,
    destination,
  } = await c
    .req
    .json() as z.infer<
      typeof schema.json
    >;
  const db = c.get("db");

  const relayKey = base64UrlEncode({
    dest: destination.urls,
  });

  const distributeUrls = destination.use_relay
    ? [`rtmp://${c.var.rtmpHostname}:1935/relay/${relayKey}`]
    : destination.urls;

  const contentPort = await getPort();
  const backgroundPort = await getPort({ exclude: [contentPort] });

  const s = new Stream({
    distributeUrls,
    backgroundFallback: {
      url: fallback_background.url,
      color: fallback_background.color,
      text: fallback_background.text,
      textColor: fallback_background.text_color,
    },
    contentUdpUrl: `udp://0.0.0.0:${backgroundPort}`,
    loadNextSource: loadNextSourceProvider({
      db: c.var.db,
      refId: id,
    }),
    downloadFile(src) {
      return fs.download({
        storageDir: c.var.downloadPath,
        src,
      });
    },
    createProcess(input) {
      const proc = new Process(input);
      proc.logger.writeToConsole = true;
      return proc;
    },
  });

  async function sendCallback(eventName: string) {
    if (!apiCallbackUrl) {
      return;
    }

    await fetch(apiCallbackUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
        stream_id: s.id,
        event_name: eventName,
      }),
    });
  }

  // add each item in the playlist to the database
  // so we know what to play next
  for (const item of playlist) {
    await db.insertInto("playlist").values({
      ref_id: id,
      stream_id: s.id,
      has_played: false,
      is_playing: false,
      data: {
        ...item,
        background: {
          url: item.background?.url,
          color: item.background?.color,
          text: item.background?.text,
          textColor: item.background?.text_color,
        },
      },
    }).execute();
  }

  // listen for events and send them
  // back to the api
  s.on("start", async () => {
    await sendCallback("start");
  });

  s.on("stop", async () => {
    await sendCallback("stop");
  });

  s.on("change", async () => {
    await sendCallback("change");
  });

  // if they want us to start, start

  if (start !== false) {
    s.start();
  }

  state.add(s);

  return c.json({
    id: s.id,
  });
}

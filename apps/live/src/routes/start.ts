import { Context, getPort, join, z, zValidator } from "../deps.ts";
import { base64UrlEncode } from "../libs/utils.ts";

import { Stream } from "../libs/stream.ts";
import state from "../libs/state.ts";
import { Process } from "../libs/process.ts";
import { fs } from "../libs/fs.ts";
import { loadNextSourceProvider } from "../libs/load-next-source.ts";

export const backgroundSchema = z.object({
  url: z.string().optional(),
  color: z.string().optional(),
  text: z.string().optional(),
  text_color: z.string().optional(),
});

export const schema = {
  json: z.object({
    autostart: z.boolean().default(true).optional(),
    id: z.string().uuid(),
    fallback_background: backgroundSchema,
    destination: z.object({
      urls: z.array(z.string()),
      use_relay: z.boolean().default(true).optional(),
    }),
    playlist: z.array(z.object({
      id: z.string().uuid(),
      src: z.string(),
      background: backgroundSchema.optional(),
    })),
  }),
};

export const validators = [
  zValidator(
    "json",
    schema.json,
  ),
];

export async function handler(c: Context) {
  const { id, playlist, autostart, fallback_background, destination } = await c
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
    backgroundUdpUrl: `udp://0.0.0.0:${contentPort}`,
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

  if (autostart !== false) {
    state.add(s.start());
  }

  return c.json({
    id: s.id,
  });
}

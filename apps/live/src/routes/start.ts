import { Context, getPort, z, zValidator } from "../deps.ts";
import { base64UrlEncode } from "../libs/utils.ts";

import { Stream } from "../libs/stream.ts";
import state from "../libs/state.ts";
import { Process } from "../libs/process.ts";

export const schema = {
  json: z.object({
    autostart: z.boolean().default(true).optional(),
    id: z.string().uuid(),
    playlist: z.array(z.object({
      src: z.string(),
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
  const { id, playlist, autostart } = await c.req.json() as z.infer<
    typeof schema.json
  >;
  const db = c.get("db");

  const key = base64UrlEncode({
    dest: [Deno.env.get("STREAM_KEY")],
  });

  const s = new Stream({
    distributeUrl: `rtmp://${c.var.rtmpHostname}:1935/relay/${key}`,
    backgroundPath: "/var/fixtures/video.mp4",
    contentUdpUrl: `udp://0.0.0.0:${await getPort()}`,
    createProcess(input) {
      return new Process(input);
    },
    async loadNextSource(state) {
      return await Promise.resolve(
        {
          ...state,
          nextSource: "/var/fixtures/audio.mp3",
        },
      );
    },
  });

  for (const item of playlist) {
    await db.insertInto("playlist").values({
      ref_id: id,
      stream_id: s.id,
      has_played: false,
      is_playing: false,
      data: item,
    }).execute();
  }

  if (autostart !== false) {
    state.add(s.start());
  }

  return c.json({
    id: s.id,
  });
}

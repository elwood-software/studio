import { Context } from "../deps.ts";

import { Stream } from "../libs/stream.ts";

const varDir = Deno.env.get("VAR_DIR");

export default function route(c: Context) {
  const s = new Stream();

  s.start();

  c.json({
    id: s.id,
  });
}

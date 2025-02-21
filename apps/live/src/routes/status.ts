import { assert, Context } from "../deps.ts";

import state from "../libs/state.ts";

export { validators } from "./stop.ts";

export async function handler(c: Context) {
  const stream = state.get(c.req.param("id"));

  assert(stream, "Missing Stream");

  const { main, content } = stream?.logs;

  return c.json({
    id: stream.id,
    logs: {
      main: main.logs,
      content: content.logs,
    },
  });
}

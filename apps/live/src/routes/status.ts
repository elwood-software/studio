import { assert, Context } from "../deps.ts";

import state from "../libs/state.ts";

export { validators } from "./stop.ts";

export function handler(c: Context) {
  const stream = state.get(c.req.param("id"));

  assert(stream, "Missing Stream");

  return c.json({
    id: stream.id,
    logs: Object.entries(stream.logs).reduce((acc, [_, item]) => {
      return [
        ...acc,
        ...item.combinedFormattedLogs,
      ];
    }, [] as string[]),
  });
}

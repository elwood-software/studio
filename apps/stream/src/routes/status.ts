import { assert, type Context, zValidator } from "../../deps.ts";
import state from "../../libs/state.ts";

import { status as schema } from "./schema.ts";

export const validators = [
  zValidator(
    "param",
    schema.params,
  ),
];

export function handler(c: Context) {
  const stream = state.get(c.req.param("id"));

  assert(stream, "Missing Stream");

  return c.json({
    id: stream.id,
    logs: Object.entries(stream.logs).reduce((acc, [_, item]) => {
      if (!item) {
        return acc;
      }

      return [
        ...acc,
        ...item.combinedFormattedLogs,
      ];
    }, [] as string[]),
  });
}

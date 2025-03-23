import { Context, z, zValidator } from "../../deps.ts";
import state from "../../libs/state.ts";

import { stop as schema } from "./schema.ts";

export const validators = [
  zValidator(
    "param",
    schema.params,
  ),
];

export function handler(c: Context) {
  const { id } = c.req.param() as z.infer<typeof schema.params>;

  state.get(id)!.stop();

  return c.json({
    ok: true,
  });
}

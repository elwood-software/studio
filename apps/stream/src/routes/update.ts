import { Context, z, zValidator } from "../../deps.ts";
import state from "../../libs/state.ts";

import { update as schema } from "./schema.ts";

export const validators = [
  zValidator(
    "param",
    schema.params,
  ),
  zValidator(
    "json",
    schema.json,
  ),
];

export function handler(c: Context) {
  const { id } = c.req.param() as z.infer<typeof schema.params>;

  state.get(id)!.stop();

  return c.json({
    ok: true,
  });
}

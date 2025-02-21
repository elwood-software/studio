import { Context, getPort, z, zValidator } from "../deps.ts";
import { base64UrlEncode } from "../libs/utils.ts";

import { Stream } from "../libs/stream.ts";
import state from "../libs/state.ts";

export const schema = {
  param: z.object({
    by: z.enum(["id", "stream"]),
    value: z.string().uuid(),
  }),
};

export const validators = [
  zValidator(
    "param",
    schema.param,
  ),
];

export async function handler(c: Context) {
  const { by, value } = c.req.param() as z.infer<typeof schema.param>;
  const db = c.get("db");

  state.get(value)!.stop();

  return c.json({
    ok: true,
  });
}

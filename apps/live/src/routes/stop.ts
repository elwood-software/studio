import { Context, z, zValidator } from "../deps.ts";

import state from "../libs/state.ts";

export const schema = {
  param: z.object({
    id: z.string().uuid(),
  }),
};

export const validators = [
  zValidator(
    "param",
    schema.param,
  ),
];

export function handler(c: Context) {
  const { id } = c.req.param() as z.infer<typeof schema.param>;

  state.get(id)!.stop();

  return c.json({
    ok: true,
  });
}

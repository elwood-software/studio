import { assert, type Context, z, zValidator } from "../../deps.ts";
import state from "../../libs/state.ts";
import { start as schema } from "./schema.ts";

export const validators = [
  zValidator(
    "param",
    schema.params,
  ),
];

export function handler(c: Context) {
  const { id } = c
    .req
    .param() as z.infer<
      typeof schema.params
    >;

  // if they want us to start, start
  const stream = state.get(id);

  assert(stream, `Unable to find stream ${id}`);

  stream.start();

  return c.json({
    id: stream.id,
  });
}

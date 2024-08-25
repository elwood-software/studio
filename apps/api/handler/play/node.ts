import type { HandlerContext } from "../../types.ts";
import { assert, uuid, z } from "../../_deps.ts";
import { entitlements, media } from "../../service/mod.ts";
import { createServiceSupabaseClient } from "../../lib/supabase.ts";

export const schema = z.object({
  "id": z.string(),
});

export const querySchema = z.object({
  "license": z.string().optional(),
  "token": z.string().optional(),
  "media": z.enum(["audio", "video"]).optional(),
});

type Schema = z.infer<typeof schema>;
type QuerySchema = z.infer<typeof querySchema>;

export async function handler(
  ctx: HandlerContext,
) {
  const params = ctx.req.param() as Schema;
  const query = ctx.req.query() as QuerySchema;
  let url: string | undefined;
  let id: string | undefined = params.id;
  let license: string | undefined = query.license;

  // if the id is not a valid uuid, it must be the license
  if (!uuid.validate(id)) {
    id = undefined;
    license = params.id;
  }

  // if there's a license, we can send it to the entitlements service
  if (license) {
    const { node_id } = await entitlements
      .parsePlaybackLicenseId(ctx.var, license);

    assert(node_id, "Node ID not found");

    const node = await ctx.get("orm").studioNode((qb) =>
      qb.where("id", "=", node_id)
    );

    const { signedUrl } = await media.createSignedUrl(ctx.var, {
      uri: node.data!.uri,
    });

    url = signedUrl;
  }

  if (id) {
    // do something else
  }

  assert(url, "Unable to create playback url");

  return ctx.redirect(
    url,
    307,
  );
}

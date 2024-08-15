import { assert, type Next } from "../_deps.ts";
import type { HandlerContext } from "../types.ts";

const instanceToOriginMap = new Map<string, string>();

export async function instanceMiddleware(
  ctx: HandlerContext,
  next: Next,
) {
  const defaultInstanceId = Deno.env.get("DEFAULT_INSTANCE_ID") ??
    "00000000-0000-0000-0000-000000000000";
  const platformApiUrl = Deno.env.get("PLATFORM_API_URL");
  const origin = normalizeOrigin(ctx.req.header("x-origin") ?? "localhost");

  ctx.set("instanceId", defaultInstanceId);

  if (origin && platformApiUrl) {
    if (instanceToOriginMap.has(origin)) {
      ctx.set("instanceId", instanceToOriginMap.get(origin)!);
      return await next();
    }

    assert(platformApiUrl, "missing PLATFORM_API_URL");

    const response = await fetch(`${platformApiUrl}/domain?origin=${origin}`);
    const data = await response.json();

    instanceToOriginMap.set(origin, data.instance_id);
    ctx.set("instanceId", data.instance);
  }

  return await next();
}

export function normalizeOrigin(str: string) {
  const url = new URL(`https://${str}`);
  return url.hostname;
}

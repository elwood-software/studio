import { assert, type Next } from "../_deps.ts";
import type { HandlerContext } from "../types.ts";
import { defaultInstanceId } from "../constants.ts";
import { DomainNotFoundError } from "./errors.ts";

const instanceToOriginMap = new Map<string, string>();

/**
 * @param envInstanceId
 * @param platformApiUrl
 * @returns
 */
export function instanceMiddleware(
  envInstanceId?: string,
  platformApiUrl?: string,
) {
  return async function middleware(
    ctx: HandlerContext,
    next: Next,
  ) {
    const origin = normalizeOrigin(ctx.req.header("x-origin") ?? "localhost");

    assert(
      !!envInstanceId || !!platformApiUrl,
      "You can not set both PLATFORM_API_URL and INSTANCE_ID",
    );

    let instanceId = envInstanceId ?? defaultInstanceId;

    // regardless of what is set, if there's a platform
    // url in the env, we need to fetch the instance id
    if (platformApiUrl) {
      assert(origin, "missing origin");

      if (!instanceToOriginMap.has(origin)) {
        try {
          const response = await fetch(`${platformApiUrl}/domain/${origin}`);
          const data = await response.json();
          assert(data.instance_id, `instanceId not found for origin ${origin}`);
          instanceToOriginMap.set(origin, data.instance_id);
        } catch (_) {
          throw new DomainNotFoundError(
            `Domain not found for origin ${origin}`,
          );
        }
      }

      instanceId = instanceToOriginMap.get(origin) as string;

      // instance id can't be the default
      assert(
        instanceId !== defaultInstanceId,
        `instanceId not found for origin ${origin}`,
      );
    }

    ctx.set("instanceId", instanceId);

    return await next();
  };
}

export function normalizeOrigin(str: string) {
  const url = new URL(`https://${str}`);
  return url.hostname;
}

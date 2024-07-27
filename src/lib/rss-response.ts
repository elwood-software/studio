import { type TypedResponse, xml } from "../_deps.ts";
import { HandlerContext, JsonObject } from "../types.ts";

export function rss(
  ctx: HandlerContext,
  response: JsonObject,
  code = 200,
): TypedResponse {
  return ctx.text(
    xml.stringify({
      "@version": "1.0",
      "@encoding": "UTF-8",

      rss: {
        "@version": "2.0",
        "@xmlns:itunes": "http://www.itunes.com/dtds/podcast-1.0.dtd",
        "@xmlns:content": "http://purl.org/rss/1.0/modules/content/",
        "@xmlns:atom": "http://www.w3.org/2005/Atom",
        "@xmlns:spotify": "http://www.spotify.com/ns/rss",
        "@xmlns:dcterms": "http://purl.org/dc/terms/",
        ...response,
      },
    }),
    // deno-lint-ignore ban-ts-comment
    // @ts-ignore
    code,
    {
      "Content-Type": "application/xml",
    },
  );
}

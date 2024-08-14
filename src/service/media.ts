import { HandlerContextVariables } from "@/types.ts";
import { createServiceSupabaseClient } from "@/lib/supabase.ts";

export type CreateSignedUrlInput = {
  uri: string | MediaUri;
};

export type CreateSignedUrlOutput = {
  signedUrl: string;
};

export async function createSignedUrl(
  _ctx: HandlerContextVariables,
  input: CreateSignedUrlInput,
): Promise<CreateSignedUrlOutput> {
  const { provider, bucket, path } = parseUri(input.uri);

  switch (provider) {
    case "supabase": {
      const client = createServiceSupabaseClient();
      const { data } = await client.storage.from(bucket).createSignedUrl(
        path,
        60,
      );

      return {
        signedUrl: data!.signedUrl,
      };
    }
  }

  return await Promise.resolve({
    signedUrl: "",
  });
}

export type MediaUri = {
  provider: string;
  providerType: string;
  bucket: string;
  path: string;
  params: Record<string, string>;
};

export function parseUri(uri: string | MediaUri): MediaUri {
  if (typeof uri !== "string") {
    return uri;
  }

  const { protocol, hostname, pathname, searchParams } = new URL(uri);
  const [bucket, ...path] = pathname.slice(1).split("/");

  return {
    provider: protocol.substring(0, protocol.length - 1),
    providerType: hostname,
    bucket,
    path: path.join("/"),
    params: Object.fromEntries(searchParams),
  };
}

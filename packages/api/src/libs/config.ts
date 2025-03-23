import { existsSync, readFileSync } from "node:fs";
import { extname, isAbsolute, join } from "node:path";
import { z } from "zod";

export const schema = z.object({
  databaseUrl: z.string(),
  clusters: z.array(z.object({
    name: z.string(),
    url: z.string(),
    auth_key: z.string(),
  })).default([]),
});

export type Configuration = z.infer<typeof schema>;

export type FullConfiguration = Required<Configuration>;

export type LoadConfigInput = string | Configuration;

export async function load(
  input: LoadConfigInput,
  cwd = process.cwd(),
): Promise<FullConfiguration> {
  if (typeof input === "string") {
    return await load(await loadFromFile(input, cwd));
  }

  return schema.parse({
    ...{ databaseUrl: process.env.DATABASE_URL ?? undefined },
    ...input,
  });
}

export async function loadFromFile(filePath_: string, cwd = process.cwd()) {
  const filePath = isAbsolute(filePath_) ? filePath_ : join(cwd, filePath_);

  // wildcard means search for any extension we can handle
  if (filePath.includes("*")) {
    for (
      const possibleFileName of [
        filePath.replace("*", "json"),
        filePath.replace("*", "js"),
      ]
    ) {
      if (existsSync(possibleFileName)) {
        return await loadFromFile(possibleFileName);
      }
    }

    return {};
  }

  switch (extname(filePath)) {
    case ".js": {
      const mod = await import(filePath);
      return mod.default ?? mod;
    }
    case ".json": {
      return JSON.parse(readFileSync(filePath).toString());
    }

    default: {
      return {};
    }
  }
}

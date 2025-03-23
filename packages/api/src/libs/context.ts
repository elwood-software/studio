import { type CreateHTTPContextOptions } from "@trpc/server/adapters/standalone";
import { type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import {
  createConnection,
  type Database,
  PostgresDialect,
  type QueueApi,
  withQueue,
} from "@elwood/studio-db";
import * as pg from "pg";

import type { QueueMessage } from "#/types.js";
import { type FullConfiguration } from "./config.js";

export type CreateContextInput = InnerContext & {
  options: CreateHTTPContextOptions | FetchCreateContextFnOptions;
};

export async function createContext(input: CreateContextInput) {
  const { options, ...innerContext } = input;

  return {
    ...innerContext,
  };
}

export type InnerContext = {
  config: FullConfiguration;
  db: Database;
  databaseWithoutSchema: Database;
  queue: QueueApi<QueueMessage>;
};

export async function createInnerContext(
  config: FullConfiguration,
): Promise<InnerContext> {
  const { database, withSchema } = await createConnection({
    dialect: new PostgresDialect({
      pool: new pg.default.Pool({
        connectionString: config.databaseUrl,
      }),
    }),
  });

  return {
    config,
    db: withSchema,
    databaseWithoutSchema: database,
    queue: withQueue(database),
  };
}

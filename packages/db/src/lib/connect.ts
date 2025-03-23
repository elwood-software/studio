import { Kysely, type KyselyConfig } from "kysely";

import type { DatabaseTables } from "#/tables/index.js";
import type { Database } from "#/types.js";

import { SchemaName } from "#/constants.js";

export type CreateConnectionOptions = KyselyConfig;
export type CreateConnectionResult = {
  database: Database;
  withSchema: Database;
};

export async function createConnection(
  options: CreateConnectionOptions,
): Promise<CreateConnectionResult> {
  const database = new Kysely<DatabaseTables>({
    ...options,
  });

  return {
    database,
    withSchema: database.withSchema(SchemaName),
  };
}

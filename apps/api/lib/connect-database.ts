import {
  assert,
  Kysely,
  Pool,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
} from "../_deps.ts";
import type {
  ConnectDatabaseResult,
  ElwoodDatabaseTables,
  PublicTables,
} from "../types.ts";
import { PostgresDriver } from "./postgres-driver.ts";

let currentConnection: ConnectDatabaseResult | undefined;

export function connectDatabase(
  databaseUrl = Deno.env.get("DB_URL"),
): ConnectDatabaseResult {
  assert(databaseUrl, "DB_URL is not set");

  if (!currentConnection) {
    const pool = new Pool(databaseUrl, 3, true);
    const elwoodConnection = new Kysely<ElwoodDatabaseTables>({
      dialect: {
        createAdapter() {
          return new PostgresAdapter();
        },
        createDriver() {
          return new PostgresDriver({ pool });
        },
        createIntrospector(db: Kysely<unknown>) {
          return new PostgresIntrospector(db);
        },
        createQueryCompiler() {
          return new PostgresQueryCompiler();
        },
      },
    });

    const publicConnection = new Kysely<PublicTables>({
      dialect: {
        createAdapter() {
          return new PostgresAdapter();
        },
        createDriver() {
          return new PostgresDriver({ pool });
        },
        createIntrospector(db: Kysely<unknown>) {
          return new PostgresIntrospector(db);
        },
        createQueryCompiler() {
          return new PostgresQueryCompiler();
        },
      },
    });

    const genericConnection = new Kysely({
      dialect: {
        createAdapter() {
          return new PostgresAdapter();
        },
        createDriver() {
          return new PostgresDriver({ pool });
        },
        createIntrospector(db: Kysely<unknown>) {
          return new PostgresIntrospector(db);
        },
        createQueryCompiler() {
          return new PostgresQueryCompiler();
        },
      },
    });

    currentConnection = {
      pool,
      generic<T>() {
        return genericConnection as Kysely<T>;
      },
      elwood: {
        query: elwoodConnection.withSchema("elwood"),
        connection: elwoodConnection,
      },
      public: {
        query: publicConnection.withSchema("public"),
        connection: publicConnection,
      },
    };
  }

  return currentConnection;
}

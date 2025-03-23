#!/usr/bin/env -S npx tsx

import * as path from "node:path";
import { promises as fs } from "node:fs";

import {
  FileMigrationProvider,
  Kysely,
  Migrator,
  PostgresDialect,
} from "kysely";
import * as pg from "pg";
import { config } from "dotenv";

import type { DatabaseTables } from "../src/tables/index.js";

// check the root dir
config({
  path: path.join(import.meta.dirname, "../../..", ".env"),
});

// check the local dir
config({
  path: path.join(import.meta.dirname, ".env"),
});

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error(`Missing DATABASE_URL`);
  process.exit(1);
}

async function migrateToLatest() {
  const db = new Kysely<DatabaseTables>({
    dialect: new PostgresDialect({
      pool: new pg.default.Pool({
        connectionString,
      }),
    }),
  });

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(import.meta.dirname, "../src/migrations"),
    }),
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((it) => {
    if (it.status === "Success") {
      console.log(`migration "${it.migrationName}" was executed successfully`);
    } else if (it.status === "Error") {
      console.error(`failed to execute migration "${it.migrationName}"`);
    }
  });

  if (error) {
    console.error("failed to migrate");
    console.error(error);
    process.exit(1);
  }

  await db.destroy();
}

migrateToLatest();

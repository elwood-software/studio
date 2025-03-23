import type { Database } from "#/types.js";
import { SchemaName } from "#/constants.js";
import { runMigrations } from "#/lib/migration-utils.js";

const migrations = [
  await import("#/tables/channel/migration.js"),
  await import("#/tables/episode/migration.js"),
  await import("#/tables/show/migration.js"),
  await import("#/tables/asset/migration.js"),
  await import("#/tables/schedule/migration.js"),
].map((m) => m.migrate01);

export async function up(db: Database): Promise<void> {
  await runMigrations(
    "up",
    migrations,
    db.schema.withSchema(SchemaName),
    db,
  );
}

export async function down(db: Database): Promise<void> {
  await runMigrations("down", migrations, db.schema.withSchema(SchemaName), db);
}

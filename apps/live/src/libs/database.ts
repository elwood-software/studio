import {
  DenoSqlite3Dialect,
  Kysely,
  type Migration,
  type MigrationProvider,
  Migrator,
  Sqlite,
} from "../deps.ts";
import type { Database, DatabaseTables } from "../types.ts";
import { TableName } from "../constants.ts";

let currentConnection: Database | null = null;

export async function connect(path: string): Promise<Database> {
  if (!currentConnection) {
    console.log(path);

    currentConnection = new Kysely<DatabaseTables>({
      dialect: new DenoSqlite3Dialect({
        database: new Sqlite(path),
      }),
    });

    const migrator = new Migrator({
      db: currentConnection,
      provider: new LocalMigrationProvider(),
    });

    console.log(await migrator.migrateToLatest());
  }

  return currentConnection;
}

class LocalMigrationProvider implements MigrationProvider {
  async getMigrations(): Promise<Record<string, Migration>> {
    return await Promise.resolve({
      "01": {
        async up(db: Database) {
          await db.schema
            .createTable(TableName.Playlist)
            .addColumn(
              "id",
              "integer",
              (col) => col.primaryKey().autoIncrement(),
            )
            .addColumn("ref_id", "text", (col) => col.notNull())
            .addColumn("stream_id", "text", (col) => col.notNull())
            .addColumn("has_played", "integer")
            .addColumn("is_playing", "integer")
            .addColumn("process_id", "integer")
            .addColumn("data", "text")
            .addColumn("started_at", "text")
            .addColumn("ended_at", "text")
            .execute();

          await db.schema
            .createTable(TableName.Process)
            .addColumn(
              "id",
              "integer",
              (col) => col.primaryKey().autoIncrement(),
            )
            .addColumn("pid", "integer", (col) => col.notNull())
            .addColumn("exit_code", "integer")
            .addColumn("last_check", "text")
            .addColumn("sig", "text")
            .execute();
        },
        async download(db: Database) {
          await db.schema.dropTable(TableName.Playlist).execute();
          await db.schema.dropTable(TableName.Process).execute();
        },
      },
    });
  }
}

import { type SchemaModule, sql } from "kysely";
import { addGUID, addUUIDPrimaryKey } from "#/lib/migration-utils.js";
import type { Database } from "#/types.js";
import { TableName } from "#/constants.js";
import { addMergeTriggerFunction } from "#/lib/functions.js";

export function migrate01(
  schema: SchemaModule,
  db: Database,
) {
  return {
    async up() {
      await addGUID(addUUIDPrimaryKey(schema.createTable(TableName.Episode)))
        .addColumn("name", "text")
        .addColumn("show_id", "uuid", (p) => p.notNull())
        .addColumn(
          "external_guid",
          "uuid",
          (p) => p.notNull().defaultTo(sql`extensions.uuid_generate_v4()`),
        )
        .addColumn(
          "data",
          "jsonb",
          (col) => col.notNull().defaultTo(sql`'{}'::jsonb`),
        )
        .execute();

      await addMergeTriggerFunction(db, TableName.Episode);
    },
    async down() {
      await schema.dropTable(TableName.Episode).ifExists().execute();
    },
  };
}

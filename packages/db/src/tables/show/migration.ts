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
      await addGUID(addUUIDPrimaryKey(schema.createTable(TableName.Show)))
        .addColumn("name", "text")
        .addColumn(
          "data",
          "jsonb",
          (col) => col.notNull().defaultTo(sql`'{}'::jsonb`),
        )
        .execute();

      await addMergeTriggerFunction(db, TableName.Show);
    },
    async down() {
      await schema.dropTable(TableName.Show).ifExists().execute();
    },
  };
}

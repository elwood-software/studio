import { type SchemaModule } from "kysely";
import { addGUID, addUUIDPrimaryKey } from "#/lib/migration-utils.js";
import type { Database } from "#/types.js";
import { TableName } from "#/constants.js";

export function migrate01(
  schema: SchemaModule,
  _db: Database,
) {
  return {
    async up() {
      await addGUID(addUUIDPrimaryKey(schema.createTable(TableName.Schedule)))
        .addColumn(
          "channel_id",
          "uuid",
          (p) => p.references(`${TableName.Channel}.id`),
        )
        .addColumn(
          "asset_id",
          "uuid",
          (p) => p.references(`${TableName.Asset}.id`),
        )
        .addColumn("is_playing", "boolean", (p) => p.defaultTo(false))
        .addColumn("weight", "integer", (p) => p.defaultTo(1))
        .execute();
    },
    async down() {
      await schema.dropTable(TableName.Schedule).ifExists().execute();
    },
  };
}

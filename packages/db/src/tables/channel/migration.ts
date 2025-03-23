import { type SchemaModule, sql } from "kysely";
import {
  addGUID,
  addUUIDPrimaryKey,
  customType,
} from "#/lib/migration-utils.js";
import type { Database } from "#/types.js";
import { ChannelTypeName, CustomTypeName, TableName } from "#/constants.js";
import { addMergeTriggerFunction } from "#/lib/functions.js";

export function migrate01(
  schema: SchemaModule,
  db: Database,
) {
  return {
    async up() {
      await schema
        .createType(customType(CustomTypeName.Channel, "string"))
        .asEnum(Object.values(ChannelTypeName))
        .execute();

      await addGUID(addUUIDPrimaryKey(schema.createTable(TableName.Channel)))
        .addColumn("type", customType(CustomTypeName.Channel, "raw"))
        .addColumn("call_sign", "text")
        .addColumn("dial_number", "decimal")
        .addColumn("display_name", "text")
        .addColumn("slug", "text")
        .addColumn(
          "data",
          "jsonb",
          (col) => col.notNull().defaultTo(sql`'{}'::jsonb`),
        )
        .execute();

      await addMergeTriggerFunction(db, TableName.Channel);
    },
    async down() {
      await schema.dropTable(TableName.Channel).ifExists().execute();
      await schema.dropType(CustomTypeName.Channel).ifExists().execute();
    },
  };
}

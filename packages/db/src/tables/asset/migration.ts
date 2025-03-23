import { DataTypeNode, Expression, type SchemaModule, sql } from "kysely";
import { addUUIDPrimaryKey, customType } from "#/lib/migration-utils.js";
import type { Database } from "#/types.js";
import {
  AssetStatusName,
  AssetTypeName,
  CustomTypeName,
  TableName,
} from "#/constants.js";
import { addMergeTriggerFunction } from "#/lib/functions.js";

export function migrate01(
  schema: SchemaModule,
  db: Database,
) {
  return {
    async up() {
      await schema
        .createType(customType(CustomTypeName.Asset, "string"))
        .asEnum(Object.values(AssetTypeName))
        .execute();

      await schema
        .createType(customType(CustomTypeName.AssetStatus, "string"))
        .asEnum(Object.values(AssetStatusName))
        .execute();

      const sth = addUUIDPrimaryKey(schema.createTable(TableName.Asset))
        .addColumn(
          "type",
          sql`"elwood_studio"."asset_type"`,
        )
        .addColumn(
          "sub_type",
          customType(CustomTypeName.Asset, "raw"),
          (p) => p.defaultTo(AssetTypeName.Unknown),
        )
        .addColumn("video_uri", "text")
        .addColumn("audio_uri", "text")
        .addColumn(
          "episode_id",
          "uuid",
          (p) => p.references(`${TableName.Episode}.id`),
        )
        .addColumn(
          "status",
          customType(CustomTypeName.AssetStatus, "raw"),
          (p) => p.defaultTo(AssetStatusName.Unknown),
        )
        .addColumn(
          "data",
          "jsonb",
          (col) => col.notNull().defaultTo(sql`'{}'::jsonb`),
        );

      await sth.execute();

      await addMergeTriggerFunction(db, TableName.Asset);
    },
    async down() {
      await schema.dropTable(TableName.Asset).ifExists().cascade().execute();
      await schema.dropType(CustomTypeName.Asset).ifExists().execute();
      await schema.dropType(CustomTypeName.AssetStatus).ifExists().execute();
    },
  };
}

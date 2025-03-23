import { type CreateTableBuilder, RawBuilder, SchemaModule, sql } from "kysely";
import type { Database } from "#/types.js";
import { CustomTypeNames, SchemaName, TableNames } from "#/constants.js";

export function customType(
  name: CustomTypeNames,
  as: "raw",
): RawBuilder<string>;
export function customType(
  name: CustomTypeNames,
  as: "sql",
): ReturnType<typeof sql>;
export function customType(
  name: CustomTypeNames,
  as: "string",
): string;
export function customType(
  name: CustomTypeNames,
  as: "sql" | "raw" | "string",
) {
  switch (as) {
    case "raw":
      return sql.raw<string>(`${SchemaName}.${name}`);
    case "sql":
      return sql`${SchemaName}.${name}`;
    case "string":
      return `${SchemaName}.${name}`;
  }
}

export type MigrationProvider = (schema: SchemaModule, db: Database) => {
  up(): Promise<void>;
  down(): Promise<void>;
};

export async function runMigrations(
  dir: "up" | "down",
  providers: MigrationProvider[],
  schema: SchemaModule,
  db: Database,
) {
  for (const provider of providers) {
    const { up, down } = provider(schema, db);

    switch (dir) {
      case "down":
        await down();
        break;
      case "up":
        await up();
        break;
      default:
        // no nothing
    }
  }
}

export function addSerialPrimaryKey<CTB extends CreateTableBuilder<TableNames>>(
  b: CTB,
  name = "id",
): CTB {
  return b.addColumn(
    name,
    "serial",
    (col) => col.primaryKey().notNull(),
  ) as CTB;
}

export function addUUIDPrimaryKey<CTB extends CreateTableBuilder<string>>(
  b: CTB,
  name = "id",
): CTB {
  return b.addColumn(name, "uuid", (col) =>
    col
      .primaryKey()
      .notNull()
      .defaultTo(sql`uuid_generate_v4()`)) as CTB;
}

export function addGUID<CTB extends CreateTableBuilder<string>>(
  b: CTB,
  name = "guid",
): CTB {
  return b.addColumn(name, "text", (col) =>
    col
      .unique()
      .notNull()
      .defaultTo(sql`uuid_generate_v4()`)) as CTB;
}

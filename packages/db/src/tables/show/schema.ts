import type {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from "kysely";
import type { JsonObject } from "@elwood/types";

export type ShowTable = {
  id: Generated<string>;
  guid: ColumnType<string, string | null, string | null>;
  name: string;
  data: ColumnType<JsonObject, JsonObject | null, JsonObject | null>;
  created_at: ColumnType<Date, null, never>;
  updated_at: ColumnType<Date, null, Date>;
};

export type Show = Selectable<ShowTable>;
export type NewShow = Insertable<ShowTable>;
export type UpdateShow = Updateable<ShowTable>;

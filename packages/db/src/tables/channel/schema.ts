import type {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from "kysely";
import type { JsonObject } from "@elwood/types";
import type { ChannelTypeNames } from "#/constants.js";

export type ChannelTable = {
  id: Generated<string>;
  guid: ColumnType<string, string | null, string | null>;
  call_sign: string | null;
  dial_number: number | null;
  display_name: string;
  slug: string;
  type: ChannelTypeNames;
  data: ColumnType<JsonObject, JsonObject | null, JsonObject | null>;
  created_at: ColumnType<Date, null, never>;
  updated_at: ColumnType<Date, null, Date>;
};

export type Channel = Selectable<ChannelTable>;
export type NewChannel = Insertable<ChannelTable>;
export type UpdateChannel = Updateable<ChannelTable>;

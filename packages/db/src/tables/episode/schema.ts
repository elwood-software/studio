import type {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from "kysely";
import type { JsonObject } from "@elwood/types";

import type { Show } from "#/tables/show/schema.js";

export type EpisodeTable = {
  id: Generated<string>;
  guid: ColumnType<string, string | null, string | null>;
  name: string | null;
  show_id: Show["id"];
  external_guid: ColumnType<string, string | null, string | null>;
  data: ColumnType<JsonObject, JsonObject | null, JsonObject | null>;
  created_at: ColumnType<Date, null, never>;
  updated_at: ColumnType<Date, null, Date>;
};

export type Episode = Selectable<EpisodeTable>;
export type NewEpisode = Insertable<EpisodeTable>;
export type UpdateEpisode = Updateable<EpisodeTable>;

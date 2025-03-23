import type {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from "kysely";

import type { Channel } from "#/tables/channel/schema.js";
import type { Asset } from "#/tables/asset/schema.js";

export type ScheduleTable = {
  id: Generated<string>;
  guid: ColumnType<string, string | null, string | null>;
  channel_id: Channel["id"] | null;
  asset_id: Asset["id"] | null;
  is_playing: ColumnType<boolean, boolean | null, boolean | null>;
  has_played: ColumnType<boolean, boolean | null, boolean | null>;
  weight: ColumnType<boolean, number | null, number | null>;
  created_at: ColumnType<Date, null, never>;
  updated_at: ColumnType<Date, null, Date>;
};

export type Schedule = Selectable<ScheduleTable>;
export type NewSchedule = Insertable<ScheduleTable>;
export type UpdateSchedule = Updateable<ScheduleTable>;

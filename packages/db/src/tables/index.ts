import type { Asset, AssetTable } from "./asset/schema.js";
import type { Channel, ChannelTable } from "./channel/schema.js";
import type { Episode, EpisodeTable } from "./episode/schema.js";
import type { Schedule, ScheduleTable } from "./schedule/schema.js";
import type { Show, ShowTable } from "./show/schema.js";

export interface DatabaseTables {
  asset: AssetTable;
  channel: ChannelTable;
  episode: EpisodeTable;
  schedule: ScheduleTable;
  show: ShowTable;
}

export type DatabaseEntity = Asset | Channel | Episode | Schedule | Show;

export type * from "./asset/schema.js";
export type * from "./channel/schema.js";
export type * from "./episode/schema.js";
export type * from "./schedule/schema.js";
export type * from "./show/schema.js";

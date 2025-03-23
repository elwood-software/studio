import type {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from "kysely";
import type { AssetStatusNames, AssetTypeNames } from "#/constants.js";
import { JsonObject } from "@elwood/types";

export type AssetTable = {
  id: Generated<string>;
  type: AssetTypeNames;
  sub_type: AssetTypeNames | null;
  video_uri: string | null;
  audio_uri: string | null;
  episode_id: string | null;
  data: ColumnType<JsonObject, JsonObject | null, JsonObject | null>;
  status: ColumnType<
    AssetStatusNames,
    AssetStatusNames | null,
    AssetStatusNames | null
  >;
  created_at: ColumnType<Date, null, never>;
  updated_at: ColumnType<Date, null, Date>;
};

export type Asset = Selectable<AssetTable>;
export type NewASset = Insertable<AssetTable>;
export type UpdateAsset = Updateable<AssetTable>;

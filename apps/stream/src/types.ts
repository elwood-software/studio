import type { ColumnType, Generated, Kysely } from "./deps.ts";

export type JsonScalar = any;
export type JsonObject = Record<string, JsonScalar>;

export type StreamBackground = Partial<{
  color: string;
  textColor: string;
  url: string;
  thumbnail_url: string;
  text: string;
}>;

export interface ContextVariableEnvMap {
  privateUrl: string;
  generateApiUrl: string;
  varDir: string;
  rtmpApiUrl: string;
  rtmpStreamPort: string;
  rtmpUdpRange: string;
  rtmpHostname: string;
  databasePath: string;
  apiCallbackUrl: string;
}

declare module "hono" {
  interface ContextVariableMap extends ContextVariableEnvMap {
    db: Database;
    downloadPath: string;
  }
}

export type Database = Kysely<DatabaseTables>;

export interface DatabaseTables {
  playlist: PlaylistTable;
  process: ProcessTable;
}

export interface PlaylistTable {
  id: Generated<number>;
  ref_id: string;
  stream_id: string;
  has_played: boolean;
  is_playing: boolean;
  data: Partial<
    {
      src: string;
    } & JsonObject
  >;
  started_at: ColumnType<Date | null>;
  ended_at: ColumnType<Date | null>;
}
export interface ProcessTable {
  id: Generated<number>;
  pid: number;
  last_check: Date | null;
  exit_code: number | null;
  sig: string | null;
}

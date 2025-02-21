import type { ColumnType, Generated, Kysely } from "./deps.ts";

export interface ContextVariableEnvMap {
  privateUrl: string;
  generateApiUrl: string;
  varDir: string;
  rtmpApiUrl: string;
  rtmpStreamPort: string;
  rtmpUdpRange: string;
  rtmpHostname: string;
  databasePath: string;
}

declare module "hono" {
  interface ContextVariableMap extends ContextVariableEnvMap {
    db: Database;
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
  data: {
    src: string;
  } & Record<string, string>;
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

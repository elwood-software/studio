export const TableName = {
  Playlist: "playlist",
  Process: "process",
} as const;

export type TableNames = typeof TableName[keyof typeof TableName];

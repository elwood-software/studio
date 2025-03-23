import type { ValuesOf } from "@elwood/types";

export const SchemaName = "elwood_studio";
export const QueueSchemaName = "pgmq";
export const QueueName = "elwood_studio";

export const TableName = {
  Asset: "asset",
  Channel: "channel",
  Show: "show",
  Episode: "episode",
  Schedule: "schedule",
} as const;

export type TableNames = ValuesOf<typeof TableName>;

// custom type names
export const CustomTypeName = {
  Asset: "asset_type",
  AssetStatus: "asset_status_type",
  Channel: "channel_type",
} as const;
export type CustomTypeNames = ValuesOf<typeof CustomTypeName>;

///
// TYPES
///

// asset_type_type
export const AssetTypeName = {
  Unknown: "UNKNOWN",
  Full: "FULL",
  Clip: "CLIP",
  Trailer: "TRAILER",
  Summary: "SUMMARY",
  Preview: "PREVIEW",
  Ad: "AD",
  Promotion: "PROMOTION",
} as const;
export type AssetTypeNames = ValuesOf<typeof AssetTypeName>;

// asset_status_type
export const AssetStatusName = {
  Unknown: "UNKNOWN",
  Pending: "PENDING",
} as const;
export type AssetStatusNames = ValuesOf<typeof AssetStatusName>;

// channel_type
export const ChannelTypeName = {
  Unknown: "UNKNOWN",
  Programmed: "PROGRAMMED",
  User: "USER",
} as const;
export type ChannelTypeNames = ValuesOf<typeof ChannelTypeName>;

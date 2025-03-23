import type { ValuesOf } from "@elwood/types";

export const QueueMessageType = {
  SYNC_RSS_FEED: "sync-rss-feed",
} as const;

export type QueueMessageTypes = ValuesOf<typeof QueueMessageType>;

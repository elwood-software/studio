export type { JsonObject, JsonScalar } from "@elwood/types";
import type { Channel } from "@elwood/studio-db";
import type { QueueMessageTypes } from "#/constants.js";

export type QueueMessage = {
  type: QueueMessageTypes;
} | {
  type: "sync-rss-feed";
  feed_url: string;
  channel_id: Channel["id"];
};

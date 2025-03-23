import type { JsonObject } from "@elwood/types";
import { type Channel, vault } from "@elwood/studio-db";
import { type InnerContext } from "#/libs/context.js";
import { type Configuration } from "#/libs/config.js";

type Cluster = Configuration["clusters"][0];

export type StreamApiRequestInput = Omit<RequestInit, "body"> & {
  cluster: Cluster;
  url: string;
  body?: JsonObject;
};

export async function streamApiRequest<T extends JsonObject = JsonObject>(
  input: StreamApiRequestInput,
): Promise<T> {
  const { cluster, url, headers = {}, body, ...init } = input;

  const url_ = url.trim().replace(/^\//, "");
  const formattedBody = body ? JSON.stringify(body) : undefined;
  const allHeaders = {
    ...headers,
    Authorization: `Token ${cluster.auth_key}`,
    "User-Agent": `stream-api/0+${cluster.name}`,
    "content-type": "application/json",
    "accepts": "application/json",
  };

  const response = await fetch(`${cluster.url}/${url_}`, {
    ...init,
    headers: allHeaders,
    body: formattedBody,
  });
  const data = await response.json();

  return data as T;
}

export function requestForCluster(
  cluster: Cluster,
): <T extends JsonObject = JsonObject>(
  input: Omit<StreamApiRequestInput, "cluster">,
) => ReturnType<typeof streamApiRequest<T>> {
  return async function request(input) {
    return await streamApiRequest({
      cluster,
      ...input,
    });
  };
}

async function start(ctx: InnerContext, channel: Channel) {
  let cluster = ctx.config.clusters.find((item) =>
    item.name === channel.data.cluster_name
  );

  // are they assigned to a cluster
  if (!cluster) {
    cluster = ctx.config.clusters[0]!;
    await ctx.db.updateTable("channel").set({
      data: {
        cluster_name: cluster.name,
      },
    }).execute();
  }

  if (!cluster) {
    throw new Error("unable to assign cluster");
  }

  const youtubeKeyVaultId = channel.data.youtube_key_vault_id;

  if (!youtubeKeyVaultId) {
    throw new Error("missing dest_youtube_key");
  }

  const youtubeKey = await vault.select(ctx.db, youtubeKeyVaultId);

  const scheduleItems = await ctx.db.selectFrom("schedule")
    .innerJoin("asset", "id", "schedule.asset_id")
    .innerJoin("episode", "id", "asset.episode_id")
    .select(["schedule.id", "asset.audio_uri", "episode.data"])
    .where(
      "channel_id",
      "=",
      channel.id,
    )
    .where("has_played", "is", false)
    .where("is_playing", "is", false).execute();

  if (scheduleItems.length === 0) {
    return {
      success: false,
      message: "No items in schedule",
    };
  }

  const result = await requestForCluster(cluster)<{ id: string }>({
    url: "/",
    method: "POST",
    body: {
      start: true,
      channel_id: channel.id,
      fallback_background: {},
      destination: {
        urls: [youtubeKey],
        use_relay: false,
      },
      playlist: scheduleItems.map((item) => ({
        id: item.id,
        src: item.audio_uri,
        vars: {
          "title": item.data.title,
        },
      })),
    },
  });

  await ctx.db.updateTable("channel").set({
    "data": {
      stream_id: result.id,
      stream_created: new Date().toISOString(),
    },
  }).execute();

  return {
    success: true,
    stream_id: result.id,
  };
}

async function stop() {
  return {
    success: false,
  };
}

async function update(ctx: InnerContext, channel: Channel) {
  const cluster = ctx.config.clusters.find((item) =>
    item.name === channel.data.cluster_name
  )!;

  const scheduleItems = await ctx.db.selectFrom("schedule")
    .innerJoin("asset", "id", "schedule.asset_id")
    .innerJoin("episode", "id", "asset.episode_id")
    .select(["schedule.id", "asset.audio_uri", "episode.data"])
    .where(
      "channel_id",
      "=",
      channel.id,
    )
    .where("has_played", "is", false)
    .where("is_playing", "is", false).execute();

  if (scheduleItems.length === 0) {
    return {
      success: false,
      message: "No items in schedule",
    };
  }

  const result = await requestForCluster(cluster)<{ id: string }>({
    url: `/${channel.data.stream_id}`,
    method: "PUT",
    body: {
      playlist: scheduleItems.map((item) => ({
        id: item.id,
        src: item.audio_uri,
        vars: {
          "title": item.data.title,
        },
      })),
    },
  });

  return {
    success: false,
  };
}

export default {
  start,
  stop,
  update,
};

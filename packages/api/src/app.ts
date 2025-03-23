import { router } from "./libs/trpc.js";

import liveCallback from "./routes/live/callback.js";
import stream from "./routes/live/stream.js";
import build from "./routes/build.js";

import * as queue from "./routes/internal/queue.js";
import * as channel from "./routes/channel.js";
import * as show from "./routes/show.js";
import * as schedule from "./routes/schedule.js";
import * as episode from "./routes/episode.js";

export const appRouter = router({
  build,
  channel: {
    create: channel.create,
  },
  show: {
    create: show.create,
  },
  schedule: {
    sync: schedule.sync,
  },
  episode: {
    create: episode.create,
  },
  live: {
    callback: liveCallback,
    stream,
  },
  internal: {
    queue: {
      create: queue.create,
      read: queue.read,
      consume: queue.consume,
    },
  },
});

export const { createCaller } = appRouter;

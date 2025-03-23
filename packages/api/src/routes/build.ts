import { z } from "zod";

import { publicProcedure } from "#/libs/trpc.js";
import rss from "#/libs/rss.js";
import utils from "#/libs/utils.js";

import { createCaller } from "#/app.js";

type Output = {
  channel_id: string;
  show_id: string;
};

const schema = z.object({
  url: z.string().url(),
});

export default publicProcedure.input(schema).mutation(
  async ({ input, ctx }): Promise<Output> => {
    const caller = createCaller(ctx);
    const feed = await rss.fetchAndParse(input.url);
    const feedGuid = utils.sha256(feed.feedUrl!);

    const channel = await caller.channel.create({
      display_name: feed.title!,
      guid: feedGuid,
    });

    const show = await caller.show.create({
      name: feed.title!,
      guid: feedGuid,
    });

    return {
      channel_id: channel.id,
      show_id: show.id,
    };
  },
);

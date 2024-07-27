import { jwt, sql, xml } from "../_deps.ts";
import type { HandlerContextVariables, JsonObject, Node } from "../types.ts";

export type CreateInput = {
  node_id: string;
  subscription_id: string;
};

export type CreateResult = {
  feed: Node;
};

/**
 * create a feed for the customer based on the subscription
 * @param ctx
 * @param input
 */
export async function create(
  ctx: HandlerContextVariables,
  input: CreateInput,
): Promise<CreateResult> {
  const db = ctx.db.elwood;

  const currentFeed = await db.query.selectFrom("node")
    .selectAll()
    .where((eb) =>
      eb("category_id", "=", sql<string>`elwood.node_category_id('FEED')`)
    )
    .where(({ eb, ref }) =>
      eb(
        ref("metadata", "->>").key("subscription_id" as unknown as never),
        "=",
        input.subscription_id,
      )
    )
    .executeTakeFirst();

  if (currentFeed) {
    return { feed: currentFeed };
  }

  const feed = await db.query.insertInto("node").values({
    instance_id: sql<string>`elwood.current_instance_id()`,
    name: ["subscription", input.node_id, input.subscription_id].join(":"),
    category_id: sql<string>`elwood.node_category_id('FEED')`,
    parent_id: input.node_id,
    status: "ACTIVE",
    metadata: {
      subscription_id: input.subscription_id,
    },
  })
    .returningAll()
    .executeTakeFirstOrThrow();

  return { feed };
}

export type ListEntitledFeedsBySubscriptionInput = {
  subscription_id: string;
};

export type ListEntitledFeedsBySubscriptionResult = {
  entitled_node_ids: string[];
};

/**
 * list the feeds that a subscription entitles a customer to
 * @param ctx
 * @param input
 * @returns
 */
export async function listEntitledFeedsBySubscription(
  ctx: HandlerContextVariables,
  input: ListEntitledFeedsBySubscriptionInput,
): Promise<ListEntitledFeedsBySubscriptionResult> {
  const db = ctx.db.elwood;

  const subscription = await db.query.selectFrom("studio_subscription")
    .selectAll()
    .where("id", "=", input.subscription_id)
    .executeTakeFirstOrThrow();

  const node = await ctx.db.public.query.selectFrom("elwood_studio_node")
    .selectAll()
    .where(
      "id",
      "=",
      subscription.node_id,
    )
    .executeTakeFirstOrThrow();

  switch (node.category) {
    case "SHOW": {
      return {
        entitled_node_ids: [node.id],
      };
    }
    case "NETWORK": {
      return {
        entitled_node_ids: [node.id],
      };
    }
    default: {
      throw new Error("Invalid node category for subscription");
    }
  }
}

export type CompileRssInput = {
  id: string;
};

export type CompileRssResult = {
  rss: JsonObject;
};

export async function compileRss(
  ctx: HandlerContextVariables,
  input: CompileRssInput,
): Promise<CompileRssResult> {
  const query = ctx.db.public.query;

  const feed = await query.selectFrom(
    "elwood_studio_node",
  )
    .selectAll()
    .where("id", "=", input.id)
    .executeTakeFirstOrThrow();

  const show = await query.selectFrom("elwood_studio_node").selectAll()
    .where(
      "id",
      "=",
      feed.parent_id,
    )
    .executeTakeFirstOrThrow();

  const items = (await sql<
    {
      title: string;
      description: string;
      audio_id: string | null;
      video_id: string | null;
      content: JsonObject;
    }
  >`SELECT * FROM public.elwood_studio_feed_items(${feed.id})`
    .execute(
      ctx.db.public.connection,
    )).rows;

  const showName = show.name;
  const showDomain = show.content.domain ?? showName;
  const showHostname = showDomain.includes(".")
    ? showDomain
    : `${showDomain}.elwood.studio`;
  const showLink = `https://${showHostname}`;

  const item = [];

  for (const episode of (items ?? [])) {
    // if there's no audio id, we should skip
    if (episode.audio_id === null) {
      continue;
    }

    const license = jwt.sign({
      n: [feed.id, episode.audio_id],
    }, "secret");

    item.push({
      title: episode.title,
      description: xml.cdata(episode.description),
      enclosure: {
        "@url": `https://${showHostname}/play/${license}`,
        "@length": "",
        "@type": "audio/mpeg",
      },
      guid: {
        "#text": episode.content.guid,
        "@isPermaLink": "false",
      },
      "content:encoded": xml.cdata(
        episode.content.content ?? episode.content.description,
      ),
      pubDate: episode.content.pubDate,
      "itunes:author": "Elwood Studio",
      "itunes:image": {
        "@href":
          "https://supercast-storage-assets.b-cdn.net/channel/802/artwork/large-1fa35c4198e605c4e63ed035b9950d2d.png",
      },
      "itunes:explicit": "no",
      "itunes:duration": episode.content.duration,
      "itunes:episodeType": "full",
    });
  }

  return {
    rss: {
      channel: {
        "atom:link": {
          "@href": `https://${showHostname}/feed/${feed.id}`,
        },
        title: show.content.title,
        link: showLink,
        language: "en",
        pubDate: new Date().toUTCString(),
        lastBuildDate: new Date().toUTCString(),
        webMaster: "feed@elwood.studio",
        description: xml.cdata(show.content.description),
        image: {
          url: show.content.image_url,
          link: showLink,
          title: show.content.image_title,
        },
        "itunes:author": show.content.author,
        "itunes:explicit": show.content.explicit ? "yes" : "no",
        "itunes:image": {
          "@href": show.content.image_url,
        },
        "itunes:owner": {
          "itunes:name": show.content.author_name,
          "itunes:email": show.content.author_email ??
            `${show.name}@${showHostname}`,
        },
        "itunes:block": "Yes",
        "itunes:type": "episodic",
      },
      item,
    },
  };
}

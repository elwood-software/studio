import { jwt, sql, xml } from "@/_deps.ts";
import type {
  HandlerContextVariables,
  JsonObject,
  Node,
  StudioContent,
  StudioNode,
} from "@/types.ts";

/*
 HOW FEEDS WORK
 ----------------
  01000 | NETWORK
  02000 ├─ SHOW
  02100 |   ├─ CONTENT
  02200 |   ├─ EPISODE
  02210 |   |   ├─ CONTENT
  02211 |   |   ├─ AUDIO/FREE
  02412 |   |   ├─ AUDIO/PAID
  02300 |   ├─ FEED:FREE (shows public feed, proxied from rss)
  02310 |   |   ├─ EPISODE [symlink to #02200]
  02400 |   ├─ FEED:PAID (show paid feed, uploaded by team)
  02410 |       ├─ EPISODE [symlink to #02200]
  02420 |       ├─ FEED:PAID:USER (user feed)
  02421 |           ├─POST (custom user content)

*/

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
    type: "BLOB",
    instance_id: sql<string>`elwood.current_instance_id()`,
    name: ["subscription", input.node_id, input.subscription_id].join(":"),
    category_id: sql<string>`elwood.node_category_id('FEED')`,
    sub_category_id: sql<string>`elwood.node_category_id('PRIVATE')`,
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

export type CompileRssInput = {
  feed: StudioNode;
};

export type CompileRssResult = {
  rss: JsonObject;
};

export async function compileRss(
  ctx: HandlerContextVariables,
  input: CompileRssInput,
): Promise<CompileRssResult> {
  const query = ctx.db.elwood.query;
  const pQuery = ctx.db.public.query;
  const { feed } = input;

  // it is possible that the feed is a child of a feed
  // in which case we'll need the grandparent to get the show content
  const [show, parentFeedId] = await getFeedShow(ctx, feed);
  const allItems: Array<{ id: string }> = [];
  const showHostname = getShowHostname(show);

  // get akk the items in the parent feed
  allItems.push(
    ...await query.selectFrom("studio_node")
      .select("id")
      .where("parent_id", "=", feed.id)
      .where((eb) => eb("category", "=", sql<string>`ANY(ARRAY['EPISODE'])`))
      .execute(),
  );

  // if there is a parent feed
  // grab all of the items from that feed
  if (parentFeedId !== feed.id) {
    allItems.push(
      ...await query.selectFrom("studio_node")
        .select("id")
        .where("parent_id", "=", parentFeedId)
        .where((eb) => eb("category", "=", sql<string>`ANY(ARRAY['EPISODE'])`))
        .execute(),
    );
  }

  const mappedItems = await Promise.all(
    allItems.map(async ({ id }) => {
      return await rssItemForEpisode(ctx, {
        id,
        showHostname,
      });
    }),
  );

  return {
    rss: {
      channel: await rssChannelFromShow(ctx, show, feed),
      item: mappedItems.filter(Boolean),
    },
  };
}

export function getShowHostname(show: StudioContent): string {
  const showName = show.name;
  const showDomain = show.content.domain ?? showName;
  const showHostname = showDomain.includes(".")
    ? showDomain
    : `${showDomain}.elwood.studio`;

  return showHostname;
}

export async function rssChannelFromShow(
  _ctx: HandlerContextVariables,
  show: StudioContent,
  feed: StudioNode,
): Promise<JsonObject> {
  const showHostname = getShowHostname(show);
  const showLink = `https://${showHostname}`;

  return {
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
    "elwood:node_id": show.id,
    "elwood:feed_type": feed.sub_category,
  };
}

export async function rssItemForEpisode(
  ctx: HandlerContextVariables,
  params: Pick<StudioNode, "id"> & {
    showHostname: string;
  },
): Promise<JsonObject | false> {
  const node = await ctx.orm.studioNode((qb) => qb.where("id", "=", params.id));

  // regardless of the category, we need an audio file we can play
  const audio = await ctx.orm.maybeStudioNode((qb) =>
    qb.where("parent_id", "=", node.id).where("category", "=", "AUDIO")
  );

  if (!audio) {
    return false;
  }

  const content = node.content as typeof node.content & {
    title: string;
    description: string;
    guid: string;
    content: "";
    pubDate: "";
    duration: "";
  };

  const license = jwt.sign({
    n: [node.id, audio.id],
  }, "secret");

  return {
    title: content.title,
    description: xml.cdata(content.description),
    enclosure: {
      "@url": `https://${params.showHostname}/play/${license}`,
      "@length": "",
      "@type": "audio/mpeg",
    },
    guid: {
      "#text": content.guid,
      "@isPermaLink": "false",
    },
    "content:encoded": xml.cdata(
      content.content ?? content.description,
    ),
    pubDate: content.pubDate,
    "itunes:author": "Elwood Studio",
    "itunes:image": {
      "@href":
        "https://supercast-storage-assets.b-cdn.net/channel/802/artwork/large-1fa35c4198e605c4e63ed035b9950d2d.png",
    },
    "itunes:explicit": "no",
    "itunes:duration": content.duration,
    "itunes:episodeType": "full",
    "elwood:node_id": node.id,
    "elwood:audio_id": audio.id,
  };
}

export async function getFeedShow(
  ctx: HandlerContextVariables,
  feed: StudioNode,
): Promise<[StudioContent, string]> {
  // this is the feeds parent
  // it could be category = 'FEED' or 'SHOW'
  const parent = await ctx.db.public.query.selectFrom("elwood_studio_content")
    .selectAll()
    .where("id", "=", feed.parent_id)
    .executeTakeFirstOrThrow();

  let show = parent;
  let showFeedId = feed.id;

  // if the parent category is a feed
  // this means we need to inherit from the parents content
  // and go up one level for the show
  if (parent.category === "FEED") {
    const grandparent = await ctx.db.public.query.selectFrom(
      "elwood_studio_content",
    )
      .selectAll()
      .where(
        "id",
        "=",
        parent.parent_id,
      )
      .executeTakeFirstOrThrow();

    showFeedId = parent.id;
    show = grandparent;
  }

  return [
    show,
    showFeedId,
  ];
}

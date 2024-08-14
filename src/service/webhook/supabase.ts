import type {
  HandlerContextVariables,
  JsonObject,
  Node,
  SupabaseWebhookPayload,
} from "@/types.ts";
import { _, basename, DBConstant, parseYaml, sql } from "@/_deps.ts";
import { contentType } from "jsr:@std/media-types";
import { createServiceSupabaseClient } from "@/lib/supabase.ts";
import { extname } from "@std/path";

/**
 * Process a Supabase Storage Sync Event
 * @param ctx
 * @param payload
 * @returns
 */
export async function processSupabaseStorageSync(
  ctx: HandlerContextVariables,
  payload: {
    body: SupabaseWebhookPayload.Any<
      SupabaseWebhookPayload.StorageObjectTableRecord
    >;
  },
): Promise<string[]> {
  const db = ctx.db.elwood.query;
  const { body } = payload;
  const record = body.type === "DELETE" ? body.old_record : body.record;
  const client = createServiceSupabaseClient();
  const normalizedFileNameNoExt = basename(
    record.name,
    extname(record.name),
  ).toLocaleLowerCase();

  if (body.type === "DELETE") {
    // find the node
    const node = await findNodeByStorageId(ctx, record);

    if (node) {
      await db.deleteFrom("node")
        .where("parent_id", "=", node.id)
        .execute();

      await db.deleteFrom("node")
        .where("id", "=", node.id)
        .execute();
    }

    // no op
    return [];
  }

  console.log(`Processing ${record.name}...`);

  type NodeFile = {
    type: "TREE" | "BLOB";
    category: string;
    name: string;
    content: JsonObject;
  };

  // see if we have a current node for this object.id
  const currentNode = await db.selectFrom("node")
    .select("id")
    .where((qb) =>
      qb(
        sql<string>`metadata->>'storage_id'`,
        "=",
        record.id,
      )
    )
    .executeTakeFirst();

  // if this is a node file, we can just do node stuff
  if (["node.yaml", "node.yml", "node.json"].includes(basename(record.name))) {
    const parentNode = await findParentNode(ctx, record);
    const { data } = await client.storage.from(record.bucket_id).download(
      record.name,
    );
    let node: NodeFile | null = null;

    console.log("parent node", parentNode);

    switch (extname(record.name)) {
      case ".yml":
      case ".yaml":
        node = (await parseYaml(await data?.text()!)) as NodeFile;
        break;
      case ".json":
        node = (JSON.parse(await data?.text()!)) as NodeFile;
        break;
    }

    if (!node) {
      return [];
    }

    if (currentNode) {
      await db.updateTable("node")
        .where("id", "=", currentNode.id)
        .set({
          type: "TREE",
          category_id: sql<
            string
          >`elwood.node_category_id(${node.category}::varchar)`,
          status: "ACTIVE",
          parent_id: parentNode?.id,
        }).execute();

      // content
      await db.updateTable("node")
        .where("parent_id", "=", currentNode.id)
        .where(
          "category_id",
          "=",
          sql<string>`elwood.node_category_id('CONTENT'::varchar)`,
        )
        .set({
          type: "TREE",
          category_id: sql<
            string
          >`elwood.node_category_id('CONTENT'::varchar)`,
          status: "ACTIVE",
          parent_id: currentNode.id,
          data: node.content,
        })
        .execute();
    } else {
      const newNode = await db.insertInto("node")
        .values(() => ({
          type: "TREE",
          category_id: sql<
            string
          >`elwood.node_category_id(${node.category}::varchar)`,
          status: "ACTIVE",
          name: node.name,
          parent_id: parentNode?.id,
          metadata: {
            storage_id: record.id,
          },
        }))
        .returning("id")
        .executeTakeFirstOrThrow();

      // content
      await db.insertInto("node")
        .values(() => ({
          type: "TREE",
          category_id: sql<
            string
          >`elwood.node_category_id('CONTENT'::varchar)`,
          status: "ACTIVE",
          name: `${node.name}:content`,
          parent_id: newNode.id,
          data: node.content,
        }))
        .returning("id")
        .executeTakeFirstOrThrow();

      // create a public and private feed for the now
      if (node.category === "SHOW") {
        await db.insertInto("node")
          .values(() => ({
            type: "TREE",
            category_id: sql<
              string
            >`elwood.node_category_id('FEED')`,
            sub_category_id: sql<
              string
            >`elwood.node_category_id('PUBLIC')`,
            status: "ACTIVE",
            name: `${node.name}:feed:public`,
            parent_id: newNode.id,
          }))
          .returning("id")
          .executeTakeFirstOrThrow();

        await db.insertInto("node")
          .values(() => ({
            type: "TREE",
            category_id: sql<
              string
            >`elwood.node_category_id('FEED')`,
            sub_category_id: sql<
              string
            >`elwood.node_category_id('PRIVATE')`,
            status: "ACTIVE",
            name: `${node.name}:feed:private`,
            parent_id: newNode.id,
          }))
          .returning("id")
          .executeTakeFirstOrThrow();
      }
    }
  }

  if (
    !currentNode &&
    ["public", "private"].includes(normalizedFileNameNoExt)
  ) {
    const episodeNode = await findSiblingNode(ctx, record);

    if (!episodeNode) {
      console.log("no episode node");
      return [];
    }

    if (!episodeNode.parent_id) {
      console.log("no show node for episode");
      return [];
    }

    const feedType = normalizedFileNameNoExt === "public"
      ? "PUBLIC"
      : "PRIVATE";

    const mediaType = contentType(extname(record.name))?.startsWith("audio/")
      ? "AUDIO"
      : "VIDEO";

    // create the private audio and attache to episode
    await db.insertInto("node")
      .values(() => ({
        type: DBConstant.NodeTypes.Blob,
        category_id: sql<string>`elwood.node_category_id(${mediaType})`,
        sub_category_id: sql<string>`elwood.node_category_id(${feedType})`,
        status: "ACTIVE",
        name:
          `${episodeNode.id}:${mediaType.toLocaleLowerCase()}:${feedType.toLocaleLowerCase()}:episode`,
        parent_id: episodeNode.id,
        data: {
          uri:
            `supabase://storage/${record.bucket_id}/${record.name}?id=${record.id}`,
          storage_id: record.id,
          storage_path: record.name,
        },
      }))
      .returning("id")
      .executeTakeFirstOrThrow();

    // get the feed
    let feed = await db.selectFrom("node")
      .select("id")
      .where("parent_id", "=", episodeNode.parent_id) // episodeNode.parent_id is show
      .where("category_id", "=", sql<string>`elwood.node_category_id('FEED')`)
      .where(
        "sub_category_id",
        "=",
        sql<string>`elwood.node_category_id(${feedType})`,
      )
      .executeTakeFirst();

    if (!feed) {
      console.log("no feed, creating...");

      feed = await db.insertInto("node")
        .values(() => ({
          type: "TREE",
          category_id: sql<string>`elwood.node_category_id('FEED')`,
          sub_category_id: sql<string>`elwood.node_category_id(${feedType})`,
          status: "ACTIVE",
          name: `${episodeNode.parent_id}:feed:${feedType.toLocaleLowerCase()}`,
          parent_id: episodeNode.parent_id,
        }))
        .returning("id")
        .executeTakeFirstOrThrow();
    }

    // create an episode
    await db.insertInto("node")
      .values(() => ({
        type: DBConstant.NodeTypes.Symlink,
        category_id: sql<string>`elwood.node_category_id('EPISODE')`,
        sub_category_id: sql<string>`elwood.node_category_id(${feedType})`,
        status: "ACTIVE",
        name: `${episodeNode.id}:feed:${feedType.toLocaleLowerCase()}:episode`,
        parent_id: feed.id,
        data: {
          target_node_id: episodeNode.id,
        },
      }))
      .returning("id")
      .executeTakeFirstOrThrow();
  }

  // if it's artwork, we only need to create a node on insert
  // otherwise we can leave it as is
  if (
    !currentNode &&
    ["artwork"].includes(basename(record.name, extname(record.name)))
  ) {
    const prefix = `${record.path_tokens.slice(0, -1).join("/")}/`;

    // find the node
    const r = await sql<{ id: string }>`
      SELECT * FROM storage.search(${prefix}, ${record.bucket_id}, 1, ${record.path_tokens.length}, 0, 'node.%') WHERE name is not null;

    `.execute(
      ctx.db.generic().withSchema("storage"),
    );

    if (r.rows.length === 0) {
      return [];
    }

    // find the node
    const parentNode = await db.selectFrom("node")
      .select("id")
      .where((qb) =>
        qb(
          sql<string>`metadata->>'storage_id'`,
          "=",
          r.rows[0]!.id,
        )
      )
      .executeTakeFirst();

    if (parentNode) {
      await db.insertInto("node")
        .values(() => ({
          type: "BLOB",
          category_id: sql<string>`elwood.node_category_id('IMAGE')`,
          sub_category_id: sql<string>`elwood.node_category_id('SRC_MAIN')`,
          status: "ACTIVE",
          name: record.id,
          parent_id: parentNode.id,
          data: {
            uri:
              `supabase://storage/${record.bucket_id}/${record.name}?id=${record.id}`,
            storage_path: record.name,
            storage_id: record.id,
          },
        }))
        .executeTakeFirstOrThrow();
    }
  }

  return [];
}

export async function findParentNode(
  ctx: HandlerContextVariables,
  record: SupabaseWebhookPayload.StorageObjectTableRecord,
): Promise<Node | null> {
  const db = ctx.db.generic();
  const prefix = `${record.path_tokens.slice(0, -2).join("/")}/`;

  const q = sql<{ id: string }>`
      SELECT * FROM storage.search(${prefix}, ${record.bucket_id}, 1, ${
    record.path_tokens.length - 1
  }, 0, 'node.%') WHERE name is not null;
    `;

  console.log(q.compile(db).sql, q.compile(db).parameters);

  const r = await q.execute(
    db,
  );

  console.log(r.rows[0]?.id);

  return r.rows[0]?.id ? await findNodeByStorageId(ctx, r.rows[0].id) : null;
}

export async function findSiblingNode(
  ctx: HandlerContextVariables,
  record: SupabaseWebhookPayload.StorageObjectTableRecord,
): Promise<Node | null> {
  const prefix = `${record.path_tokens.slice(0, -1).join("/")}/`;

  const r = await sql<{ id: string }>`
      SELECT * FROM storage.search(${prefix}, ${record.bucket_id}, 1, ${record.path_tokens.length}, 0, 'node.%') WHERE name is not null;
    `.execute(
    ctx.db.generic().withSchema("storage"),
  );

  return r.rows[0]?.id ? await findNodeByStorageId(ctx, r.rows[0].id) : null;
}

export async function findNodeByStorageId(
  ctx: HandlerContextVariables,
  recordOrStorageId: SupabaseWebhookPayload.StorageObjectTableRecord | string,
): Promise<Node | null> {
  const storageId = typeof recordOrStorageId === "string"
    ? recordOrStorageId
    : recordOrStorageId.id;

  const result = await ctx.db.elwood.query.selectFrom("node")
    .selectAll()
    .where((qb) =>
      qb(
        sql<string>`metadata->>'storage_id'`,
        "=",
        storageId,
      )
    )
    .executeTakeFirst();

  return result ?? null;
}

import type {
  HandlerContextVariables,
  JsonObject,
  SupabaseWebhookPayload,
} from "@/types.ts";
import { _, basename, parseYaml, sql } from "@/_deps.ts";

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

  if (body.type === "DELETE") {
    // no op
    return [];
  }

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
    const { data } = await client.storage.from(record.bucket_id).download(
      record.name,
    );
    let node: NodeFile | null = null;

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
    }
  }

  // if it's artwork, we only need to create a node on insert
  // otherwise we can leave it as is
  if (
    !currentNode &&
    ["artwork"].includes(basename(record.name, extname(record.name)))
  ) {
    const prefix = `${record.path_tokens.slice(0, -1).join("/")}/`;

    console.log(
      `SELECT * FROM storage.search(${prefix}, ${record.bucket_id}, 1, ${record.path_tokens.length}, 0, 'node.%') WHERE name != null;`,
    );

    // find the node
    const r = await sql<{ id: string }>`
      SELECT * FROM storage.search(${prefix}, ${record.bucket_id}, 1, ${record.path_tokens.length}, 0, 'node.%') WHERE name is not null;

    `.execute(
      ctx.db.generic().withSchema("storage"),
    );

    console.log(r.rows);

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
            storage_path: record.name,
            storage_id: record.id,
          },
        }))
        .executeTakeFirstOrThrow();
    }
  }

  return [];
}

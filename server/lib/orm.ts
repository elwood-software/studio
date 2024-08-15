import type {
  ConnectDatabaseResult,
  ElwoodDatabaseTables,
  Node,
  StudioNode,
} from "../types.ts";
import type { SelectQueryBuilder } from "../_deps.ts";

export type Filter<Tbl, Name extends keyof Tbl, Row> = (
  qb: SelectQueryBuilder<Tbl, Name, Row>,
) => SelectQueryBuilder<Tbl, Name, Row>;

export type Orm = {
  node(filter: Filter<ElwoodDatabaseTables, "node", Node>): Promise<Node>;
  studioNode(
    filter: Filter<ElwoodDatabaseTables, "studio_node", StudioNode>,
  ): Promise<StudioNode>;
  maybeNode(
    filter: Filter<ElwoodDatabaseTables, "node", Node>,
  ): Promise<Node | undefined>;
  maybeStudioNode(
    filter: Filter<ElwoodDatabaseTables, "studio_node", StudioNode>,
  ): Promise<StudioNode | undefined>;
};

export function provider(db: ConnectDatabaseResult): Orm {
  return {
    async node(filter) {
      return (await node(db, filter))!;
    },
    async studioNode(filter) {
      return (await studioNode(db, filter))!;
    },
    maybeNode(filter) {
      return node(db, filter, true);
    },
    maybeStudioNode(filter) {
      return studioNode(db, filter, true);
    },
  };
}

export async function node(
  db: ConnectDatabaseResult,
  filter: Filter<ElwoodDatabaseTables, "node", Node>,
  maybe = false,
): Promise<Node | undefined> {
  const q = filter(db.elwood.query.selectFrom("node").selectAll());

  const result =
    await (maybe ? q.executeTakeFirst() : q.executeTakeFirstOrThrow());

  if (result?.type === "SYMLINK") {
    return await node(
      db,
      (qb) => qb.where("id", "=", result.data?.target_node_id),
    );
  }

  return result;
}

export async function studioNode(
  db: ConnectDatabaseResult,
  filter: Filter<ElwoodDatabaseTables, "studio_node", StudioNode>,
  maybe: boolean = false,
): Promise<StudioNode | undefined> {
  const q = filter(db.elwood.query.selectFrom("studio_node").selectAll());

  const result =
    await (maybe ? q.executeTakeFirst() : q.executeTakeFirstOrThrow());

  if (result?.type === "SYMLINK") {
    return await studioNode(
      db,
      (qb) => qb.where("id", "=", result.data?.target_node_id),
    );
  }

  return result;
}

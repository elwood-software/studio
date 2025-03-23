import type { JsonScalar } from "@elwood/types";
import type { ColumnType, Kysely } from "kysely";

type VaultDatabase = {
  decrypted_secrets: {
    id: string;
    decrypted_secret: string;
  };
  secrets: {
    id: ColumnType<string, never, never>;
    secret: string;
  };
};

export default {
  withSchema,
  select,
  create,
};

function withSchema(db: Kysely<JsonScalar>) {
  return db.withSchema("vault") as Kysely<VaultDatabase>;
}

async function select(
  db: Kysely<JsonScalar>,
  id: string,
): Promise<string> {
  const { decrypted_secret } = await withSchema(db).selectFrom(
    "decrypted_secrets",
  ).where(
    "id",
    "=",
    id,
  ).select("decrypted_secret").executeTakeFirstOrThrow();

  return decrypted_secret;
}

async function create(
  db: Kysely<JsonScalar>,
  value: string,
): Promise<string> {
  const { id } = await withSchema(db).insertInto("secrets")
    .values({ secret: value }).returningAll().executeTakeFirstOrThrow();

  return id;
}

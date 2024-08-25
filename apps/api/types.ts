import { JsonObject } from "jsr:@elwood/db@^0.0.11/types";
import type {
  Context,
  ElwoodDatabase,
  ElwoodQueryCreator,
  Input,
  JwtVariables,
  Kysely,
  Next,
  Pool,
  PublicDatabase,
  PublicQueryCreator,
  Stripe,
  StudioCustomer,
} from "./_deps.ts";

import type { Orm } from "./lib/orm.ts";

export type Settings = {
  processWebhooksOnReceive: boolean;
  syncSupabaseBucketNames: string[];
};

export type HandlerContextVariables = JwtVariables & {
  instanceId: string;
  db: ConnectDatabaseResult;
  stripe: Stripe;
  orm: Orm;
  userId: string | undefined;
  customer: StudioCustomer | null | undefined;
  settings: Settings;
};

export type HandlerContext<
  R extends string = "",
  S extends Input = Input,
> = Context<
  {
    Variables: HandlerContextVariables;
  },
  R,
  S
>;

export type { Next };

export type * from "@elwood/db/types";

export type ConnectDatabaseResult = {
  pool: Pool;
  // TK: at some point we should have a fully typed Database
  // but for now we'll use generic for the sake of simplicity
  generic<T>(): Kysely<T>;
  elwood: {
    query: ElwoodQueryCreator;
    connection: ElwoodDatabase;
  };
  public: {
    query: PublicQueryCreator;
    connection: PublicDatabase;
  };
};

// deno-lint-ignore no-namespace
export namespace SupabaseWebhookPayload {
  export type StorageObjectTableRecord = {
    "id": string;
    "name": string;
    "owner": string | null;
    "version": string;
    "metadata": {
      "eTag": string;
      "size": number;
      "mimetype": string;
      "cacheControl": string;
      "lastModified": string;
      "contentLength": number;
      "httpStatusCode": number;
    };
    "owner_id": string | null;
    "bucket_id": string;
    "created_at": string;
    "updated_at": string;
    "path_tokens": string[];
    "last_accessed_at": string;
  };

  export type Insert<T extends JsonObject = JsonObject> = {
    type: "INSERT";
    table: string;
    schema: string;
    record: T;
    old_record: null;
  };
  export type Update<T extends JsonObject = JsonObject> = {
    type: "UPDATE";
    table: string;
    schema: string;
    record: T;
    old_record: T;
  };
  export type Delete<T extends JsonObject = JsonObject> = {
    type: "DELETE";
    table: string;
    schema: string;
    record: null;
    old_record: T;
  };

  export type Any<T extends JsonObject = JsonObject> =
    | Insert<T>
    | Update<T>
    | Delete<T>;
}

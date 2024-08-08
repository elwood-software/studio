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

export type HandlerContextVariables = JwtVariables & {
  instanceId: string;
  db: ConnectDatabaseResult;
  stripe: Stripe;
  orm: Orm;
  userId: string | undefined;
  customer: StudioCustomer | null | undefined;
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

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
} from "./_deps.ts";

export type HandlerContextVariables = JwtVariables & {
  db: ConnectDatabaseResult;
  stripe: Stripe;
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

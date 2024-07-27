import type {
  Context,
  ElwoodDatabase,
  ElwoodQueryCreator,
  Input,
  JwtVariables,
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

export type * from "@elwood/db/types";

export type ConnectDatabaseResult = {
  pool: Pool;
  elwood: {
    query: ElwoodQueryCreator;
    connection: ElwoodDatabase;
  };
  public: {
    query: PublicQueryCreator;
    connection: PublicDatabase;
  };
};

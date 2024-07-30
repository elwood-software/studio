export {
  type Context,
  Hono,
  type Input,
  type Next,
  type TypedResponse,
} from "hono";
export { z } from "zod";
export { zValidator } from "@hono/zod-validator";
export { jwt as honoJwt, type JwtVariables } from "hono/jwt";
export { assert } from "@std/assert/assert";
export { stringify as stringifyYaml } from "@std/yaml/stringify";
export {
  CompiledQuery,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
  sql,
} from "kysely";
export type {
  DatabaseConnection,
  Driver,
  PostgresCursorConstructor,
  QueryResult,
  SelectQueryBuilder,
  TransactionSettings,
} from "kysely";

export { Pool, PoolClient } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
export { Stripe } from "stripe";
export * as base64 from "@std/encoding/base64";
export * as supabase from "@supabase/supabase-js";
export * as jwt from "jsonwebtoken";
export * as xml from "@libs/xml";
export * as _ from "underscore";

export type {
  ElwoodDatabase,
  ElwoodQueryCreator,
  Node,
  PublicDatabase,
  PublicQueryCreator,
} from "@elwood/db/types";
export * as DBConstant from "@elwood/db/constants";

// ---

// below (c) https://github.com/kysely-org/kysely
// https://github.com/kysely-org/kysely/blob/master/LICENSE
// EOL >>
export type DrainOuterGeneric<T> = [T] extends [unknown] ? T : never;

// deno-lint-ignore no-explicit-any
export type ShallowRecord<K extends keyof any, T> = DrainOuterGeneric<
  {
    [P in K]: T;
  }
>;
// deno-lint-ignore ban-types
export function isFunction(obj: unknown): obj is Function {
  return typeof obj === "function";
}

export function freeze<T>(obj: T): Readonly<T> {
  return Object.freeze(obj);
}

export function extendStackTrace(err: unknown, stackError: Error): unknown {
  if (isStackHolder(err) && stackError.stack) {
    // Remove the first line that just says `Error`.
    const stackExtension = stackError.stack.split("\n").slice(1).join("\n");

    err.stack += `\n${stackExtension}`;
    return err;
  }

  return err;
}

export function isString(obj: unknown): obj is string {
  return typeof obj === "string";
}

export function isObject(obj: unknown): obj is ShallowRecord<string, unknown> {
  return typeof obj === "object" && obj !== null;
}

interface StackHolder {
  stack: string;
}

function isStackHolder(obj: unknown): obj is StackHolder {
  return isObject(obj) && isString(obj.stack);
}
// EOL

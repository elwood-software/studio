import {
  CompiledQuery,
  type DatabaseConnection,
  type Driver,
  extendStackTrace,
  freeze,
  isFunction,
  Pool,
  PoolClient,
  type PostgresCursorConstructor,
  type QueryResult,
  type TransactionSettings,
} from "../_deps.ts";

export interface PostgresDialectConfig {
  pool: Pool | (() => Promise<Pool>);
  cursor?: PostgresCursorConstructor;
  onCreateConnection?: (connection: DatabaseConnection) => Promise<void>;
}

const PRIVATE_RELEASE_METHOD = Symbol();

export class PostgresDriver implements Driver {
  readonly #config: PostgresDialectConfig;
  readonly #connections = new WeakMap<PoolClient, DatabaseConnection>();
  #pool?: Pool;

  constructor(config: PostgresDialectConfig) {
    this.#config = freeze({ ...config });
  }

  async init(): Promise<void> {
    this.#pool = isFunction(this.#config.pool)
      ? await this.#config.pool()
      : this.#config.pool;
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    const client = await this.#pool!.connect();
    let connection = this.#connections.get(client);

    if (!connection) {
      connection = new PostgresConnection(client, {
        cursor: this.#config.cursor ?? null,
      });
      this.#connections.set(client, connection);

      // The driver must take care of calling `onCreateConnection` when a new
      // connection is created. The `pg` module doesn't provide an async hook
      // for the connection creation. We need to call the method explicitly.
      if (this.#config?.onCreateConnection) {
        await this.#config.onCreateConnection(connection);
      }
    }

    return connection;
  }

  async beginTransaction(
    connection: DatabaseConnection,
    settings: TransactionSettings,
  ): Promise<void> {
    if (settings.isolationLevel) {
      await connection.executeQuery(
        CompiledQuery.raw(
          `start transaction isolation level ${settings.isolationLevel}`,
        ),
      );
    } else {
      await connection.executeQuery(CompiledQuery.raw("begin"));
    }
  }

  async commitTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw("commit"));
  }

  async rollbackTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw("rollback"));
  }

  // deno-lint-ignore require-await
  async releaseConnection(connection: PostgresConnection): Promise<void> {
    connection[PRIVATE_RELEASE_METHOD]();
  }

  async destroy(): Promise<void> {
    if (this.#pool) {
      const pool = this.#pool;
      this.#pool = undefined;
      await pool.end();
    }
  }
}

interface PostgresConnectionOptions {
  cursor: PostgresCursorConstructor | null;
}

export class PostgresConnection implements DatabaseConnection {
  #client: PoolClient;
  #options: PostgresConnectionOptions;

  get options() {
    return this.#options;
  }

  constructor(client: PoolClient, options: PostgresConnectionOptions) {
    this.#client = client;
    this.#options = options;
  }

  getClient() {
    return this.#client;
  }

  async executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
    try {
      const result = await this.#client.queryObject<O>(compiledQuery.sql, [
        ...compiledQuery.parameters,
      ]);

      if (
        result.command === "INSERT" ||
        result.command === "UPDATE" ||
        result.command === "DELETE"
      ) {
        const numAffectedRows = BigInt(result.rowCount || 0);

        return {
          numUpdatedOrDeletedRows: numAffectedRows,
          numAffectedRows,
          rows: result.rows ?? [],
        } as any;
      }

      return {
        rows: result.rows ?? [],
      };
    } catch (err) {
      throw extendStackTrace(err, new Error());
    }
  }

  // deno-lint-ignore require-yield
  async *streamQuery<O>(
    _compiledQuery: CompiledQuery,
    _chunkSize: number,
  ): AsyncIterableIterator<QueryResult<O>> {
    throw new Error("Not Supported");
  }

  [PRIVATE_RELEASE_METHOD](): void {
    this.#client.release();
  }
}

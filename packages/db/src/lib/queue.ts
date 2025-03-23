import { type Kysely, sql } from "kysely";
import type { JsonObject, JsonScalar } from "@elwood/types";
import { QueueName, QueueSchemaName } from "#/constants.js";

export type QueueMessage<MessageBody extends JsonObject = JsonObject> = {
  msg_id: number;
  read_ct: number;
  enqueued_at: string;
  vt: string;
  message: MessageBody;
};

export type QueueSendOptions = {
  delay?: number;
};

export type QueueReadOptions = {
  count?: number;
  vt?: number;
};

export type QueueReadResult<MessageBody extends JsonObject = JsonObject> =
  QueueMessage<MessageBody>[];

export type QueueApi<MessageBody extends JsonObject = JsonObject> = ReturnType<
  typeof withQueue<MessageBody>
>;

export function withQueue<MessageBody extends JsonObject = JsonObject>(
  connection: Kysely<JsonScalar>,
) {
  const db = connection.withSchema(
    QueueSchemaName,
  );

  return {
    async send(
      data: MessageBody,
      opts: QueueSendOptions = {},
    ): Promise<number> {
      const sth = await sql<{ send: number }>`
        SELECT * from pgmq.send(${QueueName}, ${JSON.stringify(data)},${
        opts.delay ?? 1
      });
      `.execute(db);
      return sth.rows[0]?.send ?? 0;
    },
    async read(
      opts: QueueReadOptions = {},
    ): Promise<QueueReadResult<MessageBody>> {
      const sth = await sql<QueueMessage<MessageBody>>`
        SELECT * FROM pgmq.read(
          queue_name => ${QueueName},
          vt         => ${opts.vt ?? 30},
          qty        => ${opts.count ?? 1}
        );
      `.execute(db);
      return sth.rows;
    },
    async pop(): Promise<QueueMessage<MessageBody> | undefined> {
      const sth = await sql<QueueMessage<MessageBody>>`
        SELECT * FROM pop(${QueueName});
      `.execute(db);
      return sth.rows[0];
    },
  };
}

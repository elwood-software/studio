import { Log } from "kysely";
import { stripAnsiCode } from "../deps.ts";

export type LogEntry = { timestamp: string; text: string };

export class Logger extends WritableStream {
  #logs: LogEntry[] = [];

  #writeToConsole = false;

  constructor(readonly prefix: string = "") {
    super({
      write: (chunk: BufferSource) => {
        this._write(chunk);
      },
    });
  }

  set writeToConsole(val: boolean) {
    this.#writeToConsole = val;
  }

  private _write(chunk: BufferSource) {
    const text = stripAnsiCode(new TextDecoder().decode(chunk));
    if (this.#writeToConsole === true) {
      console.log(`[${this.prefix}] ${text}`);
    }

    this.#logs.push({
      timestamp: new Date().toISOString(),
      text,
    });
  }

  get logs() {
    return this.#logs;
  }
}

export class OutputLogger {
  stdout: Logger;
  stderr: Logger;

  constructor(readonly prefix: string = "") {
    this.stdout = new Logger(prefix);
    this.stderr = new Logger(prefix);
  }

  set writeToConsole(val: boolean) {
    this.stderr.writeToConsole = val;
    this.stdout.writeToConsole = val;
  }

  get combinedLogs() {
    return [
      ...this.stdout.logs,
      ...this.stderr.logs,
    ];
  }

  get combinedFormattedLogs() {
    return [
      ...this.stdout.logs.map(this.#format),
      ...this.stderr.logs.map(this.#format),
    ];
  }

  #format = (item: LogEntry) => {
    return `[${this.prefix}:stdout] (${item.timestamp}) ${item.text}`;
  };

  attach(child: Deno.ChildProcess) {
    if (child.stdout) {
      child.stdout.pipeTo(this.stdout);
    }

    if (child.stderr) {
      child.stderr.pipeTo(this.stderr);
    }
  }

  async close() {
    try {
      this.stdout.getWriter().releaseLock();
      this.stderr.getWriter().releaseLock();

      await Promise.all([
        () => this.stdout.close(),
        () => this.stderr.close(),
      ]);
    } catch (_) {}
  }
}

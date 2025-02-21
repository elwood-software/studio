import { ChildProcess } from "node:child_process";
import { stripAnsiCode } from "../deps.ts";

export class Logger extends WritableStream {
  #logs: Array<{ timestamp: string; text: string }> = [];

  #writeToConsole = false;

  constructor() {
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
      console.log(text);
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
  stdout = new Logger();
  stderr = new Logger();

  set writeToConsole(val: boolean) {
    this.stderr.writeToConsole = val;
    this.stdout.writeToConsole = val;
  }

  get logs() {
    return [
      ...this.stdout.logs,
      ...this.stderr.logs,
    ];
  }

  attach(child: Deno.ChildProcess) {
    if (child.stdout) {
      child.stdout.pipeTo(this.stdout);
    }

    if (child.stderr) {
      child.stderr.pipeTo(this.stderr);
    }
  }

  async close() {
    this.stdout.getWriter().releaseLock();
    this.stderr.getWriter().releaseLock();

    await Promise.all([
      () => this.stdout.close(),
      () => this.stderr.close(),
    ]);
  }
}

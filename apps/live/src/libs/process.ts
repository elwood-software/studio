import { assert, EventEmitter } from "../deps.ts";
import { Database } from "../types.ts";
import { OutputLogger } from "./logger.ts";

export type ProcessInput = Deno.CommandOptions & {
  bin: string;
  loggerPrefix?: string;
};

export type ProcessEvents = {
  init: [];
  "after:spawn": [];
  "before:spawn": [];
  "result": [Deno.CommandStatus];
  "kill": [Deno.Signal];
};

export class Process extends EventEmitter<ProcessEvents> {
  #command: Deno.Command;
  #child: Deno.ChildProcess | null = null;
  #logger: OutputLogger;
  #result: Deno.CommandStatus | null = null;

  constructor(readonly input: ProcessInput) {
    super();

    const { bin, loggerPrefix, ...opts } = input;

    this.#logger = new OutputLogger(loggerPrefix);

    this.#command = new Deno.Command(bin, {
      ...opts,
      stdout: "piped",
      stderr: "piped",
    });

    this.emit("init");
  }

  get command() {
    return this.#command;
  }

  get child() {
    return this.#child;
  }

  get logger() {
    return this.#logger;
  }

  get stdout() {
    return this.#logger.stdout.logs;
  }

  get stderr() {
    return this.#logger.stderr.logs;
  }

  get result() {
    return this.#result;
  }

  spawn(background = false) {
    if (background) {
      setTimeout(() => {
        this.#_spawn();
      }, 1);
      return;
    }

    this.#_spawn();
  }

  #_spawn() {
    this.emit("before:spawn");
    this.#child = this.#command.spawn();
    this.#logger.attach(this.#child);
    this.emit("after:spawn");
  }

  async status() {
    assert(this.#child, "Child has not been spawned");
    this.#result = await this.#child.status;
    this.emit("result", this.#result);
    await this.#logger.close();
    return this.#result;
  }

  async kill(sig: Deno.Signal) {
    this.#child?.kill(sig);
    this.emit("kill", sig);
    // wait for the child status to make sure it's closed
    await this.status();
  }
}

export type ProcessWithDatabaseInput = ProcessInput & {
  db: Database;
};

export class ProcessWithDatabase extends Process {
  readonly db: Database;

  #id: number | null = null;

  constructor(input: ProcessWithDatabaseInput) {
    super(input);
    this.db = input.db;

    this.on("init", this._init.bind(this));
    this.on("after:spawn", this._spawn.bind(this));
    this.on("result", this._result.bind(this));
    this.on("kill", this._kill.bind(this));
  }

  async _init() {
  }

  async _spawn() {
  }

  async _result() {}

  async _kill(sig: Deno.Signal) {
  }
}

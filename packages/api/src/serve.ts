import { join } from "node:path";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import cors from "cors";
import dotenv from "dotenv";
import minimist from "minimist";

import { load } from "./libs/config.js";
import { appRouter } from "./app.js";
import { createContext, createInnerContext } from "./libs/context.js";

const {
  "env-file": envFile,
  "config-file": configFile,
  ...argv
} = minimist(process.argv.slice(3));
const cwd = argv.cwd ?? process.cwd();

if (envFile) {
  dotenv.config({
    path: join(cwd, envFile),
  });
}

const port = argv.port ?? process.env.PORT ?? process.env.NODE_PORT ?? 8000;
const host = argv.host ?? process.env.HOST ?? process.env.NODE_HOST ??
  "0.0.0.0";
const configFilePath = configFile ?? process.env.ELWOOD_CONFIG_FILE ??
  "elwood-studio.config.*";

const config = await load(configFilePath, cwd);
const innerContext = await createInnerContext(config);

const server = createHTTPServer({
  middleware: cors(),
  router: appRouter,
  createContext: async (options) =>
    await createContext({ ...innerContext, options }),
});

server.listen({ port, host }, () => {
  console.log(`starting api on ${host}:${port}`);
});

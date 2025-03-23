import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./app.js";
import { load as loadConfig, type LoadConfigInput } from "./libs/config.js";
import { createContext, createInnerContext } from "./libs/context.js";

export type CreateFetchRequestHandlerOptions = {
  config: LoadConfigInput;
  endpoint: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export async function createFetchRequestHandler(
  options: CreateFetchRequestHandlerOptions,
) {
  const config = await loadConfig(options.config);
  const innerContext = await createInnerContext(config);

  return async function fetch(request: Request) {
    if (request.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    const response = await fetchRequestHandler({
      endpoint: options.endpoint,
      req: request,
      router: appRouter,
      createContext: (options) => createContext({ ...innerContext, options }),
    });

    Object.entries(corsHeaders).map(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  };
}

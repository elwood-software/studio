import { type ContextVariableMap, Hono, proxy } from "./deps.ts";

const port = parseInt(Deno.env.get("PORT") ?? "3000", 10);
const hostname = Deno.env.get("HOSTNAME") ?? "0.0.0.0";

// other env
const envToVar: Record<keyof ContextVariableMap, string | number> = {
  port,
  hostname,
  privateUrl: Deno.env.get("PRIVATE_URL")!,
  generateApiUrl: Deno.env.get("GENERATE_API_URL")!,
  varDir: Deno.env.get("VAR_DIR")!,
  rtmpApiUrl: Deno.env.get("RTMP_API_URL")!,
  rtmpStreamPort: Deno.env.get("RTMP_STREAM_PORT")!,
  rtmpUdpRange: Deno.env.get("RTMP_UDP_RANGE")!,
};

const app = new Hono();

app.use(async (c, next) => {
  console.log(c.req.url);

  Object.entries(envToVar).forEach(([name, value]) => {
    c.set(name as keyof ContextVariableMap, value);
  });

  await next();
});

app.get("/", (c) => {
  return c.json(true);
});

app.all("/generate/:path", (c) => {
  console.log(
    "gen",
    `${c.var.generateApiUrl}/${c.req.param("path")}`,
  );

  return proxy(`${c.var.generateApiUrl}/${c.req.param("path")}`);
});

app.all("/rtmp/:path", (c) => {
  return proxy(`${c.var.rtmpApiUrl}/${c.req.param("path")}`);
});

app.get("/health", (c) => {
  return c.text(":)");
});

app.get("/dump", (c) => {
  return c.json(c.var);
});

Deno.serve({ hostname, port }, app.fetch);

// when we get a signal, kill all the streams
Deno.addSignalListener("SIGINT", () => {
  Deno.exit();
});

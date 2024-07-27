import { createApp } from "./app.ts";

const app = await createApp();

Deno.serve(app.fetch);

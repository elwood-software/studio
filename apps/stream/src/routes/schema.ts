import { z } from "../../deps.ts";

export const backgroundSchema = z.object({
  url: z.string().optional(),
  color: z.string().optional(),
  text: z.string().optional(),
  text_color: z.string().optional(),
});

export const playlistSchema = z.array(z.object({
  id: z.string().uuid(),
  src: z.string(),
  background: backgroundSchema.optional(),
  vars: z.record(z.string(), z.any()).optional(),
}));

export const create = {
  json: z.object({
    start: z.boolean().default(false).optional(),
    channel_id: z.string().uuid(),
    fallback_background: backgroundSchema,
    destination: z.object({
      urls: z.array(z.string()),
      use_relay: z.boolean().default(true).optional(),
    }),
    playlist: playlistSchema,
  }),
};

export const start = {
  params: z.object({
    id: z.string().uuid(),
  }),
};

export const status = {
  params: z.object({
    id: z.string().uuid(),
  }),
};

export const stop = {
  params: z.object({
    id: z.string().uuid(),
  }),
};

export const update = {
  params: z.object({
    id: z.string().uuid(),
  }),
  json: z.object({
    playlist: playlistSchema,
  }),
};

import Parser, { type Item, type Output } from "rss-parser";

import type { JsonObject } from "@elwood/types";

export type RssFeed = Output<Item>;

const parser = new Parser();

async function fetchRss(url: string): Promise<string> {
  const response = await fetch(url);
  return await response.text();
}

async function parse(xml: string): Promise<RssFeed> {
  return await parser.parseString(xml);
}

async function fetchAndParse(url: string): Promise<RssFeed> {
  const xml = await fetchRss(url);
  const data = await parse(xml);

  return data;
}

export default {
  fetch: fetchRss,
  parse,
  fetchAndParse,
};

import { createClient } from "jsr:@supabase/supabase-js@2";
import { parseFeed } from "jsr:@mikaelporttila/rss@*";
import { NodeTypes } from "jsr:@elwood/db@0.0.10";

if (import.meta.main) {
  main();
}

export default async function main() {
  const feedUrl = "https://feeds.simplecast.com/0T4plG50";

  const client = createClient(
    "http://127.0.0.1:54321",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU",
    {
      global: {
        headers: {
          "Authorization":
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU",
        },
      },
    },
  );

  // fetch the feed
  const response = await fetch(feedUrl);
  const text = await response.text();
  const { entries } = await parseFeed(text);

  for (const entry of entries) {
    const { id } = entry;
    const entry_ = entry as Record<string, any>;

    // EPISODE
    const { data, error } = await client.rpc("elwood_create_node", {
      p_node: {
        name: id,
        type: "TREE",
        category: "EPISODE",
        status: "ACTIVE",
        publish_at: entry.published?.toISOString(),
        parent_id: "3d0512e0-3b8d-44c5-a632-e62cda5e6479",
      },
    });

    console.log("data", data?.id, error?.message);

    // EPISODE CONTENT
    const content = await client.rpc("elwood_create_node", {
      p_node: {
        name: `${id}:content`,
        type: "BLOB",
        parent_id: data.id,
        category: "CONTENT",
        data: {
          guid: entry.id,
          title: entry.title?.value,
          description: entry.description?.value,
          pubDate: entry.published?.toISOString(),
          updateDate: entry.updated?.toISOString(),
          author: entry.author,
          content: entry.description?.value !== entry.content?.value
            ? entry.content?.value
            : undefined,
          links: entry.links ?? [],
          duration: entry_["itunes:duration"]?.value,
        },
        status: "ACTIVE",
      },
    });

    console.log("content", content.data?.id, content.error);

    // public episode symlink
    const publicEpisode = await client.rpc("elwood_create_node", {
      p_node: {
        name: `${id}:feed:episode:public`,
        type: NodeTypes.Symlink,
        parent_id: "f8f5d6cd-d32f-4dd7-b06a-a3b15c20520f",
        category: "EPISODE",
        sub_category: "PUBLIC",
        data: {
          target_node_id: data.data?.id,
        },
        status: "ACTIVE",
      },
    });

    // public audio
    const audio = await client.rpc("elwood_create_node", {
      p_node: {
        name: `${id}:content:audio:public`,
        type: "BLOB",
        parent_id: data.id,
        category: "AUDIO",
        sub_category: "FULL",
        other_categories: ["FREE"],
        data: {
          type: "external",
          attachments: entry.attachments ?? [],
        },
        status: "ACTIVE",
      },
    });

    console.log("audio", audio.data?.id, audio.error);
  }
}

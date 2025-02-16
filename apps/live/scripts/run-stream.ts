import { Stream } from "../src/libs/stream.ts";

const stream = new Stream({
  distributeUrl: "rtmp://localhost/test/key",
  backgroundPort: "8088",
  async loadNextSource() {
    return await Promise.resolve("");
  },
});

stream.start();

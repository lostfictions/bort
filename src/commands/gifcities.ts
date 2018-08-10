import * as got from "got";

import { randomInArray } from "../util";
import { makeCommand } from "../util/handler";

import { maybeTraced } from "../components/trace";

interface GifResult {
  page: string;
  url_text: string;
  checksum: string;
  weight: number;
  width: number;
  gif: string;
  height: number;
}

export default makeCommand(
  {
    name: "gifcities",
    aliases: ["geocities"],
    description: "geocities classix"
  },
  async ({ message: rawMessage, store }) => {
    let message: string;
    let prefix: string;
    if (rawMessage.length === 0) {
      const concepts = await store.get("concepts");
      if (concepts.has("noun")) {
        message = randomInArray(concepts.get("noun").toArray());
        prefix = message;
      } else {
        return false;
      }
    } else {
      ({ message, prefix } = await maybeTraced(rawMessage, store));
    }

    return prefix + (await doQuery(message));
  }
);

async function doQuery(query: string): Promise<string> {
  const res = await got(`https://gifcities.archive.org/api/v1/gifsearch`, {
    query: { q: query, limit: 5 },
    timeout: 5000
  });

  return randomInArray(
    (JSON.parse(res.body) as GifResult[]).map(
      g => "https://web.archive.org/web/" + g.gif
    )
  );
}

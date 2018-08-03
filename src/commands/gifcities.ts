import * as got from "got";

import { randomInArray } from "../util";
import { makeCommand } from "../util/handler";

import { tryTrace } from "../components/trace";

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
  async ({ message, store }): Promise<string | false> => {
    if (message.length === 0) {
      return false;
    }

    const concepts = await store.get("concepts");
    const maybeTraced = tryTrace(message, concepts);
    if (maybeTraced) {
      return doQuery(maybeTraced).then(res => `(${maybeTraced})\n${res}`);
    }
    return doQuery(message);
  }
);

async function doQuery(query: string): Promise<string> {
  const res = await got(`https://gifcities.archive.org/api/v1/gifsearch`, {
    query: { q: query, limit: 5 },
    timeout: 5000
  });

  return randomInArray<string>(
    JSON.parse(res.body).map(
      (g: GifResult) => "https://web.archive.org/web/" + g.gif
    )
  );
}

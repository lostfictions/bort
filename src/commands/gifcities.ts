import axios from "axios";

import { randomInArray, randomByWeight } from "../util";
import { makeCommand } from "../util/handler";

import { maybeTraced } from "../components/trace";
import { getConcept } from "../store/methods/concepts";

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
      const nouns = await getConcept(store, "noun");
      if (nouns) {
        message = randomByWeight(nouns);
        prefix = `(${message})\n`;
      } else {
        return false;
      }
    } else {
      ({ message, prefix } = await maybeTraced(store, rawMessage));
    }

    return prefix + (await doQuery(message));
  }
);

async function doQuery(query: string): Promise<string> {
  const res = await axios.get<GifResult[]>(
    `https://gifcities.archive.org/api/v1/gifsearch`,
    {
      params: { q: query, limit: 5 },
      timeout: 5000,
      responseType: "json"
    }
  );

  return randomInArray(
    res.data.map(g => "https://web.archive.org/web/" + g.gif)
  );
}

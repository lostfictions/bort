import { makeCommand } from "../util/handler.ts";
import { randomByWeight } from "../util/index.ts";

import { addRecent, getRecents } from "../store/methods/recents.ts";
import { maybeTraced } from "../components/trace.ts";
import { imageSearch } from "../components/image-search.ts";

import { getConcept } from "../store/methods/concepts.ts";

import type { DB } from "../store/get-db.ts";

async function doSearch(rawMessage: string, store: DB, animated = false) {
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

  const recents = await getRecents(store);

  let result = await imageSearch({
    term: message,
    recents,
    animated,
  });

  if (typeof result === "string") {
    await addRecent(store, result);
  } else {
    result = "nothing :(";
  }

  return prefix + result;
}

export const imageSearchCommand = makeCommand(
  {
    name: "image",
    aliases: [
      `what's`,
      `who's`,
      `what is`,
      `who is`,
      `show me the`,
      `show me an`,
      `show me a`,
      `show me`,
      `show`,
    ],
    description: "i will show you",
  },
  async ({ message, store }) => doSearch(message, store),
);

export const gifSearchCommand = makeCommand(
  {
    name: "gifsearch",
    aliases: ["gif me the", "gif me an", "gif me a", "gif me", "gif"],
    description: "moving pictures",
  },
  async ({ message, store }) => doSearch(message, store, true),
);

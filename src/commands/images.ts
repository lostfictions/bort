import { makeCommand } from "../util/handler";
import { randomInArray } from "../util";

import { addRecentAction } from "../reducers/recents";
import { maybeTraced } from "../components/trace";
import { imageSearch } from "../components/image-search";

import { BortStore } from "../store/make-store";

async function doSearch(
  rawMessage: string,
  store: BortStore,
  animated = false
) {
  let message: string;
  let prefix: string;
  if (rawMessage.length === 0) {
    const concepts = await store.get("concepts");
    if ("noun" in concepts) {
      message = randomInArray(concepts["noun"]);
      prefix = message;
    } else {
      return false;
    }
  } else {
    ({ message, prefix } = await maybeTraced(rawMessage, store));
  }

  const recents = await store.get("recents");
  const dispatch = store.dispatch;

  let result = await imageSearch({
    term: message,
    recents,
    animated
  });

  if (typeof result === "string") {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    dispatch(addRecentAction(result));
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
      `show`
    ],
    description: "i will show you"
  },
  async ({ message, store }) => doSearch(message, store)
);

export const gifSearchCommand = makeCommand(
  {
    name: "gifsearch",
    aliases: ["gif me the", "gif me an", "gif me a", "gif me", "gif"],
    description: "moving pictures"
  },
  async ({ message, store }) => doSearch(message, store, true)
);

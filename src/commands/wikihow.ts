import ky from "ky";
import * as cheerio from "cheerio";

import { makeCommand } from "../util/handler.ts";
import { randomInArray } from "../util/index.ts";

import { maybeTraced } from "../components/trace.ts";
import { imageSearch } from "../components/image-search.ts";
import { addRecent, getRecents } from "../store/methods/recents.ts";

async function getRandomWikihowImage(): Promise<string> {
  const res = await ky.get("https://www.wikihow.com/Special:Randomizer").text();

  const imgs = cheerio
    .load(res)("img.whcdn")
    .toArray()
    .map((img) => img.attribs["data-src"])
    .filter((url) => url); // only images with this attribute!

  return randomInArray(imgs);
}

export default makeCommand(
  {
    name: "wikihow",
    aliases: [`how do i`, `how to`, `how`],
    description: "learn anything",
  },
  async ({ message: rawMessage, store }): Promise<string> => {
    if (rawMessage.trim().length === 0) {
      return getRandomWikihowImage();
    }

    const { message, prefix } = await maybeTraced(store, rawMessage);

    const recents = await getRecents(store);

    let result = await imageSearch({
      term: `${message} site:wikihow.com`,
      recents,
    });

    if (typeof result === "string") {
      await addRecent(store, result);
    } else {
      result = "nothing :(";
    }

    return prefix + result;
  },
);

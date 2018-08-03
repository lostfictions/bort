import { makeCommand } from "../util/handler";
import * as got from "got";
import * as cheerio from "cheerio";

import { randomInArray } from "../util";

import { tryTrace } from "../components/trace";

import { search } from "./images";

function getRandomWikihowImage(): Promise<string> {
  return got("https://www.wikihow.com/Special:Randomizer").then(res => {
    const imgs = cheerio
      .load(res.body)("img.whcdn")
      .toArray()
      .map(img => img.attribs["data-src"])
      .filter(url => url); // only images with this attribute!
    return randomInArray(imgs);
  });
}

export default makeCommand(
  {
    name: "wikihow",
    aliases: [`how do i`, `how to`],
    description: "learn anything"
  },
  async ({ message, store }): Promise<string> => {
    if (message.length === 0) {
      return getRandomWikihowImage();
    }

    const dispatch = store.dispatch;
    const recents = await store.get("recents");

    const concepts = await store.get("concepts");
    const maybeTraced = tryTrace(message, concepts);
    if (maybeTraced) {
      return search({
        term: maybeTraced + " site:wikihow.com",
        dispatch,
        recents
      }).then(res => `(${maybeTraced})\n${res}`);
    }

    return search({ term: message + " site:wikihow.com", dispatch, recents });
  }
);

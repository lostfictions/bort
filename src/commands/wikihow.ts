import { makeCommand } from "../util/handler";
import * as got from "got";
import * as cheerio from "cheerio";

import { randomInArray } from "../util";

import { HandlerArgs } from "../handler-args";
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

export default makeCommand<HandlerArgs>(
  {
    name: "wikihow",
    aliases: [`how do i`, `how to`],
    description: "learn anything"
  },
  ({ message, store }): Promise<string> => {
    if (message.length === 0) {
      return getRandomWikihowImage();
    }

    const maybeTraced = tryTrace(message, store.getState().get("concepts"));
    if (maybeTraced) {
      return search(maybeTraced + " site:wikihow.com", store).then(
        res => `(${maybeTraced})\n${res}`
      );
    }

    return search(message + " site:wikihow.com", store);
  }
);

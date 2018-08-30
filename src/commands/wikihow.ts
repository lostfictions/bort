import axios from "axios";
import * as cheerio from "cheerio";

import { makeCommand } from "../util/handler";
import { randomInArray } from "../util";

import { maybeTraced } from "../components/trace";

import { search } from "./images";

function getRandomWikihowImage(): Promise<string> {
  return axios.get("https://www.wikihow.com/Special:Randomizer").then(res => {
    const imgs = cheerio
      .load(res.data)("img.whcdn")
      .toArray()
      .map(img => img.attribs["data-src"])
      .filter(url => url); // only images with this attribute!
    return randomInArray(imgs);
  });
}

export default makeCommand(
  {
    name: "wikihow",
    aliases: [`how do i`, `how to`, `how`],
    description: "learn anything"
  },
  async ({ message: rawMessage, store }): Promise<string> => {
    if (rawMessage.length === 0) {
      return getRandomWikihowImage();
    }

    const { message, prefix } = await maybeTraced(rawMessage, store);

    const dispatch = store.dispatch;
    const recents = await store.get("recents");

    return (
      prefix +
      (await search({ term: message + " site:wikihow.com", dispatch, recents }))
    );
  }
);

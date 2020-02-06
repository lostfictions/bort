import axios from "axios";
import cheerio from "cheerio";

import { makeCommand } from "../util/handler";
import { randomInArray } from "../util";

import { maybeTraced } from "../components/trace";
import { imageSearch } from "../components/image-search";
import { addRecentAction } from "../reducers/recents";

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

    let result = await imageSearch({
      term: message + " site:wikihow.com",
      recents
    });

    if (typeof result === "string") {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispatch(addRecentAction(result));
    } else {
      result = "nothing :(";
    }

    return prefix + result;
  }
);

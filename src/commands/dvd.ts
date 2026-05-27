import ky from "ky";
import * as cheerio from "cheerio";

import { makeCommand } from "../util/handler.ts";
import { randomInArray, randomInt } from "../util/index.ts";

let cachedPageCount: number | null = null;

export default makeCommand(
  {
    name: "dvd",
    description: "get a random dvd menu",
  },
  async ({ sendMessage }): Promise<string> => {
    if (!cachedPageCount) {
      const firstPage = await ky.get("https://dvdmoviemenus.com/").text();
      const pageCountText = cheerio
        .load(firstPage)(".page-numbers:not(.prev):not(.next)")
        .last()
        .text();
      const pageCount = parseInt(pageCountText);
      if (Number.isNaN(pageCount)) {
        throw new Error(
          `Expected number for page count, got: "${pageCountText}"`,
        );
      }
      // eslint-disable-next-line require-atomic-updates
      cachedPageCount = pageCount;
    }

    const selectedPage = `https://dvdmoviemenus.com/page/${randomInt(cachedPageCount + 1)}/`;
    const res = await ky.get(selectedPage).text();

    const $ = cheerio.load(res);
    const images = $(".post-thumb-img-content")
      .toArray()
      .map((el) => [
        $(el).find("a").attr("href"),
        $(el).find(".wp-post-image").attr("src"),
      ]);

    console.log(selectedPage);

    const [href, img] = randomInArray(images);
    if (!href || !img) {
      throw new Error(`missing href or img on <${selectedPage}>`);
    }
    await sendMessage(`<${href}>`);
    return img;
  },
);

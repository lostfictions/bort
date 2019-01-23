import axios from "axios";
import * as cheerio from "cheerio";

import { makeCommand } from "../util/handler";
import { randomInArray } from "../util";

export const USAGE = "Usage: `vidrand <letterboxd list url>`";

export async function getFilmUrlsFromLetterboxdList(url: string) {
  let currentPage = 1;
  const allResults = [];
  let pageResults;

  do {
    const resolvedUrl = url.endsWith("/")
      ? `${url}page/${currentPage}`
      : `${url}/page/${currentPage}`;

    const res = await axios(resolvedUrl);

    pageResults = cheerio
      .load(res.data)(".poster")
      .toArray()
      .map(div => div.attribs["data-film-slug"])
      .filter(slug => slug)
      .map(u => `https://letterboxd.com${u}`);

    allResults.push(...pageResults);
    currentPage++;
  } while (pageResults != null && pageResults.length > 0);

  return allResults;
}

export default makeCommand(
  {
    name: "vidrand",
    description: "get a random video from a letterboxd list"
  },
  async ({ message, store }): Promise<string> => {
    if (message.length === 0) {
      const concepts = await store.get("concepts");
      const watchlists = concepts["!watchlist"];
      if (!watchlists || watchlists.length === 0) {
        return [
          `No default Letterboxd watchlist defined!`,
          `Set a concept called \`!watchlist\` with an url first.`
        ].join("\n");
      }

      return randomInArray(await getFilmUrlsFromLetterboxdList(watchlists[0]));
    }

    if (!message.startsWith("https://letterboxd.com/")) {
      return USAGE;
    }

    return randomInArray(await getFilmUrlsFromLetterboxdList(message));
  }
);

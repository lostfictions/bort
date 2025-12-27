import ky, { HTTPError } from "ky";
import * as cheerio from "cheerio";

import { makeCommand } from "../util/handler.ts";
import { randomInArray } from "../util/index.ts";
import { getConcept } from "../store/methods/concepts.ts";

export const USAGE = [
  "Usage:",
  "`vidrand <letterboxd list url>`",
  "`vidrand` (with a default list assigned to `!watchlist`)",
].join("\n");

const ONE_DAY = 1000 * 60 * 60 * 24;

// Hackish non-persistent cache to speed up results
const resultCache = {} as {
  [url: string]: { lastRetrieved: number; results: string[] };
};

export async function getFilmUrlsFromLetterboxdList(
  url: string,
): Promise<string[] | { errorMessage: string }> {
  const cachedValue = resultCache[url];
  if (cachedValue && cachedValue.lastRetrieved > Date.now() - ONE_DAY) {
    return cachedValue.results;
  }

  let currentPage = 1;
  const allResults = [];
  let pageResults: string[];

  do {
    const resolvedUrl = url.endsWith("/")
      ? `${url}page/${currentPage}`
      : `${url}/page/${currentPage}`;

    let res;
    try {
      res = await ky.get(resolvedUrl).text();
    } catch (e) {
      if (e instanceof HTTPError && e.response.status === 404) {
        return { errorMessage: `Couldn't find a page at '<${url}>'!` };
      }

      throw e;
    }

    pageResults = cheerio
      .load(res)(".posteritem .react-component, .poster-grid .react-component")
      .toArray()
      .map((div) => div.attribs["data-item-link"])
      .filter((slug) => slug);

    allResults.push(...pageResults);
    currentPage++;
  } while (pageResults != null && pageResults.length > 0);

  if (allResults.length === 0) {
    return {
      errorMessage: `Scraped '<${url}>', but CSS selector returned no results! Ensure page type is compatible.`,
    };
  }

  resultCache[url] = {
    lastRetrieved: Date.now(),
    results: allResults,
  };
  return allResults;
}

export default makeCommand(
  {
    name: "vidrand",
    description: "get a random video from a letterboxd list",
  },
  async ({ message, store }): Promise<string> => {
    let url = message;

    if (url.length === 0) {
      const watchlists = await getConcept(store, "!watchlist");
      if (!watchlists || Object.keys(watchlists).length === 0) {
        return [
          `No default Letterboxd watchlist defined!`,
          `Set a concept called \`!watchlist\` with an url first.`,
        ].join("\n");
      }

      url = Object.keys(watchlists)[0];
      if (!url.startsWith("https://letterboxd.com/")) {
        return `The contents of \`!watchlist\` doesn't seem to be an url! ("${url}")`;
      }
    }

    if (!url.startsWith("https://letterboxd.com/")) {
      return USAGE;
    }

    const result = await getFilmUrlsFromLetterboxdList(url);

    if (Array.isArray(result)) {
      return `https://letterboxd.com${randomInArray(result)}`;
    }

    return `Error getting a random vid:\n${result.errorMessage}`;
  },
);

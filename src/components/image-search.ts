import ky from "ky";
import * as cheerio from "cheerio";

import { randomInt } from "../util/index.ts";

/**
 * Perform an image search, optionally filter recently-seen images, and select a
 * random image from the top N remaining results.
 */
export async function imageSearch({
  term,
  selectFromTop = 5,
  recents,
  animated = false,
}: {
  term: string;
  selectFromTop?: number;
  recents?: { [url: string]: unknown };
  animated?: boolean;
}): Promise<string | false> {
  const res = await requestAndParse({ term, animated, exact: true });
  // TODO: check if comparable "exact" search possible with bing
  // if (res.length === 0) {
  //   // if no results, try an inexact search
  //   res = await requestAndParse({ term, animated });
  // }

  let cursor = 0;
  let sliced: string[] = [];

  while (sliced.length === 0 && cursor < res.length) {
    sliced = res.slice(cursor, cursor + selectFromTop);

    if (recents) {
      for (let i = sliced.length - 1; i >= 0; i--) {
        // TODO [-level] replace `in` operator
        // eslint-disable-next-line no-restricted-syntax
        if (sliced[i] in recents) {
          sliced.splice(i, 1);
        }
      }
    }

    cursor += selectFromTop;
  }

  while (sliced.length > 0) {
    let [result] = sliced.splice(randomInt(sliced.length), 1);

    // rewrite .gifv => .gif
    if (result.endsWith(".gifv")) {
      result = result.slice(0, -1);
    }

    // test that it actually exists
    try {
      await ky.head(result);
      return result;
    } catch {
      // don't care, just try another result
    }
  }

  return false;
}

export interface ImageSearchOptions {
  term: string;
  animated?: boolean;
  exact?: boolean;
  transparent?: boolean;
}

export async function requestAndParse(options: ImageSearchOptions) {
  const res = await request(options);
  return parse(res);
}

export function request({
  term,
  animated,
  exact,
  transparent,
}: ImageSearchOptions) {
  const searchParams: Record<string, string | number> = {
    q: term,
    qs: "n",
    sp: "-1",
    lq: "0",
    pq: term,
    sc: "10-5",
    first: "1",
  };

  if (animated) {
    searchParams.qft = "+filterui:photo-animatedgif";
  } else if (transparent) {
    searchParams.qft = "+filterui:photo-transparent";
  }

  return ky
    .get("https://www.bing.com/images/search", {
      searchParams,
      timeout: 5000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64; rv:148.0) Gecko/20100101 Firefox/148.0",
      },
    })
    .text();
}

export function parse(html: string) {
  const $ = cheerio.load(html);

  const strategies = [murlStrategy];

  for (const s of strategies) {
    const res = s($);
    if (res && res.length > 0) return res;
  }

  return [];
}

export function murlStrategy($: cheerio.CheerioAPI): string[] | false {
  const imgData = $("div.imgpt > a.iusc")
    .toArray()
    .map((el) => $(el).attr("m"));

  if (imgData.length > 0) {
    return imgData
      .map((res) => (res ? JSON.parse(res)["murl"] : undefined))
      .filter((url) => {
        try {
          URL.parse(url);
        } catch {
          return false;
        }
        return true;
      });
  }

  return false;
}

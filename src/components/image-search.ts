import axios from "axios";
import cheerio from "cheerio";

import { randomInt } from "../util";

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
  let res = await requestAndParse({ term, animated, exact: true });
  if (res.length === 0) {
    // if no results, try an inexact search
    res = await requestAndParse({ term, animated });
  }

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
      await axios.head(result);
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
  return parse(res.data);
}

export function request({
  term,
  animated,
  exact,
  transparent,
}: ImageSearchOptions) {
  const tbs = [transparent && "ic:trans", animated && "itp:animated"]
    .filter(Boolean)
    .join(",");

  return axios.get<string>("https://www.google.com/search", {
    params: {
      q: term,
      tbm: "isch",
      nfpr: exact ? 1 : 0,
      tbs: tbs || undefined,
    },
    timeout: 5000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/79.0.3945.79 Safari/537.36",
    },
  });
}

export function parse(html: string) {
  const $ = cheerio.load(html);

  const strategies = [allJsonpStrategy];

  for (const s of strategies) {
    const res = s($);
    if (res && res.length > 0) return res;
  }

  return [];
}

const PREFIX = "AF_initDataCallback";

export function allJsonpStrategy($: cheerio.Root): string[] | false {
  const scripts = $("script")
    .toArray()
    .map((el) => $(el).text())
    .filter((t) => t.startsWith(PREFIX));

  if (scripts.length > 0) {
    return scripts
      .flatMap((script) => [
        ...script.matchAll(/"(https?:\/\/[^"]+\.(?:jpe?g|gifv?|png))"/g),
      ])
      .map((res) =>
        // google image search results sometimes contain code points encoded as
        // eg. \u003d, so replace them with their actual values
        res[1].replace(/\\u([a-fA-F0-9]{4})/gi, (_, g) =>
          String.fromCodePoint(parseInt(g, 16))
        )
      );
  }

  return false;
}

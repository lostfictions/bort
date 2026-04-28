import ky from "ky";
import { z } from "zod";
import { randomInt } from "../util/index.ts";

export const searchResultSchema = z.object({
  results: z.array(z.object({ image: z.string() })),
});

function get(url: string) {
  return ky.get(url, {
    headers: {
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.5",
      Referer: "https://duckduckgo.com/",
      "Sec-GPC": "1",
      Connection: "keep-alive",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
      Priority: "u=4",
    },
  });
}

async function getVqd(query: string): Promise<string> {
  const res = await get(
    `https://duckduckgo.com?${new URLSearchParams({ q: query }).toString()}`,
  ).text();

  for (const pat of [/vqd="([^"]*)"/, /vqd=([^&]*)&/, /vqd='([^']*)'/]) {
    const match = res.match(pat);
    if (match) return match[1];
  }

  throw new Error(`Could not extract vqd for query "${query}".`);
}

async function search(query: string, gif?: boolean) {
  const vqd = await getVqd(query);

  const f = ["hide_ai_images:1"];
  if (gif) f.unshift("type:gif");

  const params = new URLSearchParams({
    o: "json",
    q: query,
    l: "us-en",
    vqd,
    p: "-1",
    ct: "AT",
    f: f.join(","),
  });

  const res = await get(
    `https://duckduckgo.com/i.js?${params.toString()}`,
  ).json();

  const { results } = searchResultSchema.parse(res);

  return results.map((r) => r.image);
}

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
  const res = await search(term, animated);

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

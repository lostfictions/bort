import { URL } from "url";
import axios from "axios";
import { stripIndent, oneLine } from "common-tags";

import { makeCommand } from "../util/handler";
import { addConcept, getConcept } from "../store/methods/concepts";

const loaderRegex = /^([^ ]+) +(?:path[=: ]([\w\d.]+) +)?(?:as|to) +([^\s]+)$/;

const slackEscapeRegex = /^<(.+)>$/;

const traverse = (obj: any, path: string[]): any => {
  try {
    // eslint-disable-next-line no-param-reassign
    for (const p of path) obj = obj[p];
    return obj;
  } catch (e) {
    /* just toss out any failure to traverse and return null. */
  }
  return null;
};

const usage = stripIndent`
  ${oneLine`
    \`load\` is a command that allows you to pull in a concept from a file on
    the internet. the file can be in **plaintext** (with each concept on its own
    line) or in **json**. you need to specify which concept the loaded
    concepts should be stored under with \`as <conceptname>\`.
  `}

  **here's a plaintext example:**
  \`bort load https://coolhorse.horse/quotes.txt as horse\`

  ${oneLine`
    for json, you must specify the **path** to the array of concepts you want --
    the series of keys under which the array is nested. if your json looks like
    this:
  `}
  \`\`\`json
  { "cool": { "dudes": ["alfonso", "garfunkel"] }  }
  \`\`\`
  the path would be \`cool.dudes\`.

  **here's a json example:**
  \`bort load https://coolhorse.horse/quotes.json path=horseQuotes as horse\`
`;

export default makeCommand(
  {
    name: "load",
    aliases: ["json"],
    description:
      "load a concept list from a url, overwriting the existing concept if it exists",
  },
  async ({ message, store }) => {
    const matches = loaderRegex.exec(message);
    if (message.length === 0 || !matches) {
      return usage;
    }

    const [, rawUrl, rawPath, concept] = matches;

    const path = rawPath?.split(".");

    let url = rawUrl;
    const slackFixedUrl = slackEscapeRegex.exec(rawUrl);
    if (slackFixedUrl) {
      url = slackFixedUrl[1];
    }

    try {
      // eslint-disable-next-line no-new
      new URL(url);
    } catch {
      return `Error: '${url}' doesn't appear to be a valid URL.\n${usage}`;
    }

    // responseType: json attempts to convert to json, but falls back to string if not.
    const { data: maybeJson } = await axios.get(url, { responseType: "json" });

    const result: string[] = [];
    let items: string[];
    if (typeof maybeJson === "string") {
      result.push(
        "Response type appears to be plaintext. Splitting to newlines."
      );
      items = maybeJson.split("\n").map((l) => l.trim());
    } else if (path) {
      const itemOrItems = traverse(maybeJson, path);
      if (!itemOrItems) {
        const validKeys = Object.keys(maybeJson)
          .slice(0, 5)
          .map((k) => `'${k}'`)
          .join(", ");
        throw new Error(
          `Invalid path: '${rawPath}'. Some valid keys: ${validKeys}...`
        );
      }
      if (Array.isArray(itemOrItems)) {
        items = itemOrItems.map((i) => i.toString());
      } else {
        const item = itemOrItems.toString();
        if (item === "[object Object]") {
          throw new Error(
            `The item at "${path}" does not appear to be a primitive or array!`
          );
        }
        items = [item];
      }
    } else if (Array.isArray(maybeJson)) {
      result.push("Response type appears to be a JSON array.");
      items = maybeJson.map((i) => i.toString());
    } else {
      throw new Error(oneLine`
        The file at this URL seems to be JSON, but it's not an array.
        (Did you forget to specify a \`path\` for the load command?)
      `);
    }

    const maybeConcept = await getConcept(store, message);
    if (maybeConcept) {
      const count = Object.keys(maybeConcept).length;
      result.push(`Overwrote concept "${concept}" (that had ${count} entries)`);
    } else {
      result.push(`Added new concept "${concept}"`);
    }

    await addConcept(store, concept, items, true);

    result.push(`with ${items.length} items from ${url}.`);
    return result.join(" ");
  }
);

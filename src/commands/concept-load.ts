import { URL } from "url";
import axios from "axios";

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

const usage = `*load* usage: [url] path=[path] as [concept]`;

export default makeCommand(
  {
    name: "load",
    aliases: ["json"],
    description:
      "load a concept list from a url, overwriting existing concept if it exists",
  },
  async ({ message, store }) => {
    const matches = loaderRegex.exec(message);
    if (message.length === 0 || !matches) {
      return usage;
    }

    const [, rawUrl, rawPath, concept] = matches;

    const path = rawPath.split(".");

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

    const { data: json } = await axios.get(url, { responseType: "json" });

    let items: string[];
    if (path) {
      const itemOrItems = traverse(json, path);
      if (!itemOrItems) {
        const validKeys = Object.keys(json)
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
            `Requested item does not appear to be a primitive or array! Aborting.`
          );
        }
        items = [item];
      }
    } else if (Array.isArray(json)) {
      items = json.map((i) => i.toString());
    } else {
      const item = json.toString();
      if (item === "[object Object]") {
        throw new Error(
          `Requested item does not appear to be a primitive or array! Aborting.`
        );
      }
      items = [item];
    }

    const result: string[] = [];
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

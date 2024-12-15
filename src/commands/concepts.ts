import { makeCommand, adjustArgs } from "../util/handler.ts";
import {
  addConcept,
  removeConcept,
  getConcept,
  addToConcept,
  removeFromConcept,
} from "../store/methods/concepts.ts";
import type { HandlerArgs } from "../handler-args.ts";

type HandlerArgsWithConcept = HandlerArgs & { concept: string };

// Match two groups:
// 1: a bracket-delimited term of any length
// 2: the rest of the message if there is any, ignoring any preceding whitespace
const matcher = /^\[([^\[\]]+)\](?:$|\s+(.*))/; // eslint-disable-line no-useless-escape

function normalizeMessageWithLeadingConcept(message: string): [string, string] {
  // The matcher will match concepts/commands either in the format
  // "adj add humongous" OR "[adj] add humongous".
  // This lets us match concepts that contain whitespace
  // like "[kind of animal]", as well as concepts that might
  // otherwise be processed as a keyword or command, like "[delete]".

  // We try matching against the "matcher" regex above, then
  // normalize the results.
  let matches: string[] | null = message.match(matcher);
  if (!matches) {
    const split = message.split(" ");
    matches = ["", split[0], split.slice(1).join(" ")];
  }

  return [matches[1], matches[2] || ""];
}

export const conceptAddCommand = makeCommand(
  {
    name: "add",
    aliases: ["+"],
    description: "add a new concept",
  },
  async ({ message, store }) => {
    if (message.length === 0) {
      return false;
    }

    const maybeConcept = await getConcept(store, message);
    if (maybeConcept) {
      return `Concept "${message}" already exists!`;
    }
    await addConcept(store, message);
    return `Okay! Added a concept named "${message}".`;
  },
);

export const conceptRemoveCommand = makeCommand(
  {
    name: "remove",
    aliases: ["delete", "-"],
    description: "delete an existing concept",
  },
  async ({ message, store }) => {
    if (message.length === 0) {
      return false;
    }

    const maybeConcept = await getConcept(store, message);
    if (!maybeConcept) {
      return `Concept "${message}" doesn't exist!`;
    }

    await removeConcept(store, message);
    return `Okay! Deleted concept "${message}".`;
  },
);

export const conceptSetCommand = makeCommand(
  {
    name: "set",
    description:
      "set the contents of a concept, overwriting the existing concept if it exists",
  },
  async ({ message, store }) => {
    if (message.length === 0) {
      return false;
    }

    const [concept, remainder] = normalizeMessageWithLeadingConcept(message);
    const args = remainder.split(",").map((s) => s.trim());
    const result: string[] = [];

    const maybeConcept = await getConcept(store, message);
    if (maybeConcept) {
      const count = Object.keys(maybeConcept).length;
      result.push(`Overwrote concept "${concept}" (that had ${count} entries)`);
    } else {
      result.push(`Added new concept "${concept}"`);
    }

    await addConcept(store, concept, args, true);

    result.push(`with ${args.length} new entries.`);
    return result.join(" ");
  },
);

export const conceptListCommand = makeCommand(
  {
    name: "list",
    aliases: ["get"],
    description: "list everything in a concept",
  },
  async ({ message, store }) => {
    if (message.length === 0) {
      return false;
    }

    const concepts = await getConcept(store, message);

    const items = Object.keys(concepts);
    if (items.length > 100) {
      return [
        `"${message}" has ${items.length} items in it! Only showing the first 100.`,
        items.slice(0, 100).join(", "),
      ].join("\n");
    }
    const itemList = items.length > 0 ? items.join(", ") : "_Empty._";
    return `*${message}:*\n${itemList}`;
  },
);

// We could probably come up with a better naming scheme, but:
// the commands above are used to add and remove and list top-level
// concepts, while the commands below add and remove the
// contents of individual concepts.

const conceptAddToCommand = makeCommand<HandlerArgsWithConcept>(
  {
    name: "add",
    aliases: ["+"],
    description: "add to a concept",
  },
  async ({ message, store, concept }) => {
    if (message.length === 0) {
      return false;
    }

    const maybeConcept = await getConcept(store, concept);
    if (!maybeConcept) {
      return `Concept "${message}" doesn't exist!`;
    }

    if (Object.hasOwn(maybeConcept, concept)) {
      return `"${message}" already exists in "${concept}"!`;
    }

    await addToConcept(store, concept, [message]);
    return `Okay! Added "${message}" to "${concept}".`;
  },
);

const conceptBulkAddToCommand = makeCommand<HandlerArgsWithConcept>(
  {
    name: "bulkadd",
    aliases: ["++"],
    description: "add a comma-separated list of things to a concept",
  },
  async ({ message, store, concept }) => {
    if (message.length === 0) {
      return false;
    }
    const conceptsToAdd = message.split(",").map((s) => s.trim());

    const maybeConcept = await getConcept(store, concept);
    if (!maybeConcept) {
      return `Concept "${message}" doesn't exist!`;
    }

    const results = conceptsToAdd
      .filter((c) => Object.hasOwn(maybeConcept, c))
      .map((c) => `"${c}" already exists in "${concept}"!`);

    const toAdd = conceptsToAdd.filter((c) => !Object.hasOwn(maybeConcept, c));

    await addToConcept(store, concept, toAdd);

    return results.concat(toAdd.map((c) => `Added "${c}".`)).join("\n");
  },
);

const conceptRemoveFromCommand = makeCommand<HandlerArgsWithConcept>(
  {
    name: "remove",
    aliases: ["delete", "-"],
    description: "remove from a concept",
  },
  async ({ message, store, concept }) => {
    if (message.length === 0) {
      return false;
    }

    const maybeConcept = await getConcept(store, concept);
    if (!maybeConcept) {
      return `Concept "${message}" doesn't exist!`;
    }

    if (!Object.hasOwn(maybeConcept, message)) {
      return `"${message}" doesn't exist in "${concept}"!`;
    }

    await removeFromConcept(store, concept, [message]);
    return `Okay! Removed "${message}" from "${concept}".`;
  },
);

// The conceptMatcher matches commands that start with a concept,
// adjusts the arguments to include the normalized concept in question
// and removes it from the message, and then redirects to one of the
// commands above.
export const conceptMatcher = adjustArgs<HandlerArgsWithConcept, HandlerArgs>(
  async (args) => {
    const { message, store } = args;
    if (message.length === 0) {
      return false;
    }

    const [concept, command] = normalizeMessageWithLeadingConcept(message);

    const maybeConcept = await getConcept(store, concept);
    if (!maybeConcept) {
      return false;
    }

    return { ...args, message: command, concept };
  },
  [conceptAddToCommand, conceptBulkAddToCommand, conceptRemoveFromCommand],
);

import { makeCommand, adjustArgs } from "../util/handler";
import { HandlerArgs } from "../handler-args";
import {
  addConceptAction,
  removeConceptAction,
  addToConceptAction,
  removeFromConceptAction,
  loadConceptAction
} from "../reducers/concepts";

export type ConceptBank = { [conceptName: string]: string[] };

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
  let matches = message.match(matcher);
  if (!matches) {
    const split = message.split(" ");
    matches = ["", split[0], split.slice(1).join(" ")];
  }

  return [matches[1], matches[2]];
}

export const conceptAddCommand = makeCommand(
  {
    name: "add",
    aliases: ["+"],
    description: "add a new concept"
  },
  async ({ message, store }) => {
    if (message.length === 0) {
      return false;
    }

    const concepts = await store.get("concepts");
    if (message in concepts) {
      return `Concept "${message}" already exists!`;
    }
    await store.dispatch(addConceptAction(message));
    return `Okay! Added a concept named "${message}".`;
  }
);

export const conceptRemoveCommand = makeCommand(
  {
    name: "remove",
    aliases: ["delete", "-"],
    description: "delete an existing concept"
  },
  async ({ message, store }) => {
    if (message.length === 0) {
      return false;
    }

    const concepts = await store.get("concepts");
    if (!(message in concepts)) {
      return `Concept "${message}" doesn't exist!`;
    }
    await store.dispatch(removeConceptAction(message));
    return `Okay! Deleted concept "${message}".`;
  }
);

export const conceptSetCommand = makeCommand(
  {
    name: "set",
    description:
      "set the contents of a concept, overwriting the existing concept if it exists"
  },
  async ({ message, store }) => {
    if (message.length === 0) {
      return false;
    }

    const [concept, remainder] = normalizeMessageWithLeadingConcept(message);
    const args = remainder.split(",").map(s => s.trim());
    const result: string[] = [];

    const concepts = await store.get("concepts");
    if (concept in concepts) {
      const count = concepts[concept].length;
      result.push(`Overwrote concept "${concept}" (that had ${count} entries)`);
    } else {
      result.push(`Added new concept "${concept}"`);
    }
    await store.dispatch(loadConceptAction(concept, args));

    result.push(`with ${args.length} new entries.`);
    return result.join(" ");
  }
);

export const conceptListCommand = makeCommand(
  {
    name: "list",
    aliases: ["get"],
    description: "list everything in a concept"
  },
  async ({ message, store }) => {
    if (message.length === 0) {
      return false;
    }

    const concepts = await store.get("concepts");
    if (!(message in concepts)) {
      return `Concept "${message}" doesn't exist!`;
    }

    const items = concepts[message];
    if (items.length > 100) {
      return (
        `"${message}" has ${items.length} items in it! Only showing the first 100.\n` +
        items.slice(0, 100).join(", ")
      );
    }
    return (
      `*${message}:*\n` + (items.length > 0 ? items.join(", ") : "_Empty._")
    );
  }
);

// We could probably come up with a better naming scheme, but:
// the commands above are used to add and remove and list top-level
// concepts, while the commands below add and remove the
// contents of individual concepts.

const conceptAddToCommand = makeCommand<HandlerArgsWithConcept>(
  {
    name: "add",
    aliases: ["+"],
    description: "add to a concept"
  },
  async ({ message, store, concept }) => {
    if (message.length === 0) {
      return false;
    }

    const concepts = await store.get("concepts");
    if (concepts[concept].includes(message)) {
      return `"${message}" already exists in "${concept}"!`;
    }
    await store.dispatch(addToConceptAction(concept, message));
    return `Okay! Added "${message}" to "${concept}".`;
  }
);

const conceptBulkAddToCommand = makeCommand<HandlerArgsWithConcept>(
  {
    name: "bulkadd",
    aliases: ["++"],
    description: "add a comma-separated list of things to a concept"
  },
  async ({ message, store, concept }) => {
    if (message.length === 0) {
      return false;
    }
    const conceptsToAdd = message.split(",").map(s => s.trim());

    const concepts = await store.get("concepts");
    const results: string[] = [];
    for (const c of conceptsToAdd) {
      if (concepts[concept].includes(c)) {
        results.push(`"${c}" already exists in "${concept}"!`);
      } else {
        // eslint-disable-next-line no-await-in-loop
        await store.dispatch(addToConceptAction(concept, c));
        results.push(`Added "${c}".`);
      }
    }
    return results.join("\n");
  }
);

const conceptRemoveFromCommand = makeCommand<HandlerArgsWithConcept>(
  {
    name: "remove",
    aliases: ["delete", "-"],
    description: "remove from a concept"
  },
  async ({ message, store, concept }) => {
    if (message.length === 0) {
      return false;
    }

    const concepts = await store.get("concepts");

    if (!concepts[concept].includes(message)) {
      return `"${message}" doesn't exist in "${concept}"!`;
    }
    await store.dispatch(removeFromConceptAction(concept, message));
    return `Okay! Removed "${message}" from "${concept}".`;
  }
);

// The conceptMatcher matches commands that start with a concept,
// adjusts the arguments to include the normalized concept in question
// and removes it from the message, and then redirects to one of the
// commands above.
export const conceptMatcher = adjustArgs<HandlerArgs>(
  async args => {
    const { message, store } = args;
    if (message.length === 0) {
      return false;
    }

    const [concept, command] = normalizeMessageWithLeadingConcept(message);

    const concepts = await store.get("concepts");
    if (!(concept in concepts)) {
      return false;
    }
    return { ...args, message: concept + " " + command };
  },
  adjustArgs<HandlerArgsWithConcept, HandlerArgs>(
    args => {
      const split = args.message.split(" ");
      const concept = split[0];
      const adjustedMessage = split.slice(1).join(" ");
      return { ...args, message: adjustedMessage, concept };
    },
    [conceptAddToCommand, conceptBulkAddToCommand, conceptRemoveFromCommand]
  )
);

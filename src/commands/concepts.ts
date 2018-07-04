import { makeCommand, adjustArgs } from "../util/handler";
import { Map, List } from "immutable";

import { HandlerArgs } from "../handler-args";
import {
  addConceptAction,
  removeConceptAction,
  addToConceptAction,
  removeFromConceptAction
} from "../actions/concept";

export type ConceptBank = Map<string, List<string>>;

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

export const conceptAddCommand = makeCommand<HandlerArgs>(
  {
    name: "add",
    aliases: ["+"],
    description: "add a new concept"
  },
  ({ message, store }) => {
    if (message.length === 0) {
      return false;
    }

    const concepts = store.getState().get("concepts");
    if (concepts.has(message)) {
      return `Concept "${message}" already exists!`;
    }
    store.dispatch(addConceptAction(message));
    return `Okay! Added a concept named "${message}".`;
  }
);

export const conceptRemoveCommand = makeCommand<HandlerArgs>(
  {
    name: "remove",
    aliases: ["delete", "-"],
    description: "delete an existing concept"
  },
  ({ message, store }) => {
    if (message.length === 0) {
      return false;
    }

    const concepts = store.getState().get("concepts");
    if (!concepts.has(message)) {
      return `Concept "${message}" doesn't exist!`;
    }
    store.dispatch(removeConceptAction(message));
    return `Okay! Deleted concept "${message}".`;
  }
);

export const conceptSetCommand = makeCommand<HandlerArgs>(
  {
    name: "set",
    description:
      "set the contents of a concept, overwriting the existing concept if it exists"
  },
  ({ message, store }) => {
    if (message.length === 0) {
      return false;
    }

    const [concept, remainder] = normalizeMessageWithLeadingConcept(message);
    const args = remainder.split(",").map(s => s.trim());
    const result: string[] = [];

    const concepts = store.getState().get("concepts");
    if (concepts.has(concept)) {
      const count = concepts.get(concept).count();
      store.dispatch(removeConceptAction(concept));
      result.push(`Overwrote concept "${concept}" (that had ${count} entries)`);
    } else {
      result.push(`Added new concept "${concept}"`);
    }
    store.dispatch(addConceptAction(concept));

    for (const c of args) {
      store.dispatch(addToConceptAction(concept, c));
    }

    result.push(`with ${args.length} new entries.`);
    return result.join(" ");
  }
);

export const conceptListCommand = makeCommand<HandlerArgs>(
  {
    name: "list",
    aliases: ["get"],
    description: "list everything in a concept"
  },
  ({ message, store }) => {
    if (message.length === 0) {
      return false;
    }

    const concepts = store.getState().get("concepts");
    if (!concepts.has(message)) {
      return `Concept "${message}" doesn't exist!`;
    }

    const items = concepts.get(message);
    if (items.size > 100) {
      return (
        `"${message}" has ${
          items.size
        } items in it! Only showing the first 100.\n` +
        items.slice(0, 100).join(", ")
      );
    }
    return `*${message}:*\n` + (items.size > 0 ? items.join(", ") : "_Empty._");
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
  ({ message, store, concept }) => {
    if (message.length === 0) {
      return false;
    }

    const concepts = store.getState().get("concepts");
    if (concepts.get(concept).indexOf(message) !== -1) {
      return `"${message}" already exists in "${concept}"!`;
    }
    store.dispatch(addToConceptAction(concept, message));
    return `Okay! Added "${message}" to "${concept}".`;
  }
);

const conceptBulkAddToCommand = makeCommand<HandlerArgsWithConcept>(
  {
    name: "bulkadd",
    aliases: ["++"],
    description: "add a comma-separated list of things to a concept"
  },
  ({ message, store, concept }) => {
    if (message.length === 0) {
      return false;
    }
    const conceptsToAdd = message.split(",").map(s => s.trim());

    const concepts = store.getState().get("concepts");
    const results: string[] = [];
    for (const c of conceptsToAdd) {
      if (concepts.get(concept).indexOf(c) !== -1) {
        results.push(`"${c}" already exists in "${concept}"!`);
      } else {
        store.dispatch(addToConceptAction(concept, c));
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
  ({ message, store, concept }) => {
    if (message.length === 0) {
      return false;
    }

    const concepts = store.getState().get("concepts");

    if (concepts.get(concept).indexOf(message) === -1) {
      return `"${message}" doesn't exist in "${concept}"!`;
    }
    store.dispatch(removeFromConceptAction(concept, message));
    return `Okay! Removed "${message}" from "${concept}".`;
  }
);

// The conceptMatcher matches commands that start with a concept,
// adjusts the arguments to include the normalized concept in question
// and removes it from the message, and then redirects to one of the
// commands above.
export const conceptMatcher = adjustArgs<HandlerArgs>(
  args => {
    const { message, store } = args;
    if (message.length === 0) {
      return false;
    }

    const [concept, command] = normalizeMessageWithLeadingConcept(message);

    const concepts = store.getState().get("concepts");
    if (!concepts.has(concept)) {
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

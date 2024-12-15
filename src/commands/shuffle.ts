import { makeCommand } from "../util/handler.ts";

import { randomInt } from "../util/index.ts";
import { getConcept } from "../store/methods/concepts.ts";

export default makeCommand(
  {
    name: "shuffle",
    description: "pull things out of a bag until there's none left",
  },
  async ({ message, store }): Promise<string> => {
    if (message.length === 0) {
      return "I need a concept to shuffle!";
    }

    let normalizedMessage = message;
    if (message.startsWith("[") && message.endsWith("]")) {
      normalizedMessage = message.slice(1, -1);
    }

    const concept = await getConcept(store, normalizedMessage);
    if (!concept) {
      return `Unknown concept: [${normalizedMessage}]`;
    }

    const bag = Object.keys(concept);
    const output: string[] = [];
    while (bag.length > 0) {
      output.push(...bag.splice(randomInt(bag.length), 1));
    }

    return output.join(", ");
  },
);

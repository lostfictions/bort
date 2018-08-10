import { Store } from "../store/store";
import { randomInArray } from "../util";
import { ConceptBank } from "../commands/concepts";

export const matcher = /\[([^\[\]]+)\]/g; // eslint-disable-line no-useless-escape

type Modifier = (token: string, ...args: string[]) => string;
interface ModifierList {
  [filterName: string]: Modifier;
}
interface TraceArgs {
  concepts: ConceptBank;
  concept: string;
  maxCycles?: number;
  seen?: { [seen: string]: number };
  modifierList?: ModifierList;
}

const isVowel = (char: string) => /^[aeiou]$/i.test(char);

// TODO: filter length 0 before passing through to simplify all of these
export const defaultModifiers: ModifierList = {
  s: word => {
    if (word.length < 1) return word;
    switch (word[word.length - 1].toLowerCase()) {
      case "s":
      case "h":
      case "x":
        return word + "es";
      case "y":
        return !isVowel(word[word.length - 2])
          ? word.substring(0, word.length - 1) + "ies"
          : word + "s";
      default:
        return word + "s";
    }
  },
  a: word => {
    switch (true) {
      case word.length < 1:
        return word;
      case word[0].toLowerCase() === "u" &&
        word.length > 2 &&
        word[2].toLowerCase() === "i":
        return "a " + word;
      case isVowel(word[0]):
        return "an " + word;
      default:
        return "a " + word;
    }
  },
  ed: word => {
    if (word.length < 1) return word;
    switch (word[word.length - 1]) {
      case "e":
        return word + "d";
      case "y":
        return word.length > 1 && !isVowel(word[word.length - 2])
          ? word.substring(0, word.length - 1) + "ied"
          : word + "d";
      default:
        return word + "ed";
    }
  },
  ing: word => {
    if (word.length < 1) return word;
    if (word[word.length - 1].toLowerCase() === "e") {
      return word.substring(0, word.length - 1) + "ing";
    }
    return word + "ing";
  },
  upper: word => word.toUpperCase(),
  cap: word =>
    word.length > 0 ? word[0].toUpperCase() + word.substring(1) : "",
  swap: (word, search, replacement) => word.split(search).join(replacement)
};

defaultModifiers["an"] = defaultModifiers["a"];
defaultModifiers["es"] = defaultModifiers["s"];

export default function trace({
  concepts,
  concept,
  maxCycles = 10,
  seen = {},
  modifierList = defaultModifiers
}: TraceArgs): string {
  const [resolvedConcept, ...modifierChunks] = concept.split("|");
  const modifiers = modifierChunks
    .map(chunk => {
      const [modifierName, ...args] = chunk.split(" ");
      return [modifierList[modifierName], args] as [Modifier, string[]];
    })
    .filter(resolved => resolved[0]);

  if (!(resolvedConcept in concepts)) {
    return `{error: unknown concept "${resolvedConcept}"}`;
  }
  const traceResult = randomInArray(concepts[resolvedConcept]).replace(
    matcher,
    (_, nextConcept) => {
      if (seen[nextConcept] > maxCycles) {
        return "{error: max cycles exceeded}";
      }
      const nextSeen = { ...seen };
      nextSeen[nextConcept] = nextSeen[nextConcept] + 1 || 1;
      return trace({
        concepts,
        concept: nextConcept,
        maxCycles,
        seen: nextSeen
      });
    }
  );
  return modifiers.reduce((result, m) => m[0](result, ...m[1]), traceResult);
}

export function tryTrace(
  message: string,
  concepts: ConceptBank
): string | false {
  if (matcher.test(message)) {
    return message.replace(matcher, (_, concept) =>
      trace({ concepts, concept })
    );
  }
  return false;
}

export async function maybeTraced(message: string, store: Store) {
  const concepts = await store.get("concepts");
  const traced = tryTrace(message, concepts);
  let prefix = "";
  if (traced) {
    message = traced;
    prefix = `(${traced})\n`;
  }
  return {
    message,
    prefix
  };
}

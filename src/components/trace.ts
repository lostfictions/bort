import { randomByWeight } from "../util";
import { DB } from "../store/get-db";
import { getConcept } from "../store/methods/concepts";

type Modifier = (token: string, ...args: string[]) => string;
interface ModifierList {
  [filterName: string]: Modifier;
}
interface TraceArgs {
  db: DB;
  concept: string;
  maxCycles?: number;
  seen?: { [seen: string]: number };
  modifierList?: ModifierList;
}

export const MAX_CYCLES_ERROR = "{error: max cycles exceeded}";

export const unknownConceptError = (c: string) => `{unknown concept "${c}"}`;
export const emptyConceptError = (c: string) => `{empty concept "${c}"}`;

export const matcher = /\[([^[\]]+)\]/g;

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

export async function trace({
  db,
  concept,
  maxCycles = 10,
  seen = {},
  modifierList = defaultModifiers
}: TraceArgs): Promise<string> {
  if (seen[concept] > maxCycles) {
    return MAX_CYCLES_ERROR;
  }

  const [resolvedConcept, ...modifierChunks] = concept.split("|");
  const modifiers = modifierChunks
    .map(chunk => {
      const [modifierName, ...args] = chunk.split(" ");
      return [modifierList[modifierName], args] as [Modifier, string[]];
    })
    .filter(resolved => resolved[0]);

  const concepts = await getConcept(db, resolvedConcept);

  if (!concepts) {
    return unknownConceptError(resolvedConcept);
  }

  if (Object.keys(concepts).length === 0) {
    return emptyConceptError(resolvedConcept);
  }

  let result = randomByWeight(concepts);
  const matches = [...result.matchAll(matcher)].reverse();

  for (const match of matches) {
    const [group, nextConcept] = match;
    const i = match.index!;

    // eslint-disable-next-line no-await-in-loop
    const traceResult = await trace({
      db,
      concept: nextConcept,
      seen: { ...seen, [nextConcept]: seen[nextConcept] + 1 || 1 },
      maxCycles,
      modifierList
    });

    result =
      result.substring(0, i) + traceResult + result.substring(i + group.length);
  }

  return modifiers.reduce((res, m) => m[0](res, ...m[1]), result);
}

export async function tryTrace(
  db: DB,
  message: string
): Promise<string | false> {
  const matches = [...message.matchAll(matcher)].reverse();

  if (matches.length > 0) {
    let result = message;
    for (const match of matches) {
      const [group, concept] = match;
      const i = match.index!;

      // eslint-disable-next-line no-await-in-loop
      const traceResult = await trace({ db, concept });
      result =
        result.substring(0, i) +
        traceResult +
        result.substring(i + group.length);
    }
    return result;
  }
  return false;
}

export async function maybeTraced(db: DB, message: string) {
  const traced = await tryTrace(db, message);
  let prefix = "";
  if (traced) {
    // eslint-disable-next-line no-param-reassign
    message = traced;
    prefix = `(${traced})\n`;
  }
  return {
    message,
    prefix
  };
}

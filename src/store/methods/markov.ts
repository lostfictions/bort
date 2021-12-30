import { promises as fs } from "fs";
import path from "path";
import assert from "assert";

import debug from "debug";

import { randomInArray, randomByWeight } from "../../util";
import { DB } from "../get-db";
import {
  getWithDefault,
  getOrNull,
  isRestrictedObjectPropertyName,
} from "../db-helpers";
import { endTest } from "./markov-helpers";

const log = debug("bort-verbose:markov");

export type MarkovEntry = { [followingOrPrecedingWord: string]: number };

const sentenceSplitter = /[.?\n]/gi;
const wordNormalizer = (word: string) => word.toLowerCase().replace(/\|/g, "_");

// TODO: improve?
const wordFilter = (word: string) =>
  word.length > 0 &&
  !word.startsWith("<") && // might be historical now, for slack?
  !word.startsWith("@") &&
  !word.startsWith("http") &&
  !isRestrictedObjectPropertyName(word);

export const DEFAULT_NAMESPACE = "default";

export const prefixForward = (ns: string) => `markov:${ns}`;
export const prefixReverse = (ns: string) => `markov-rev:${ns}`;

export const keyTrigramForward = (
  first: string,
  second: string,
  ns = DEFAULT_NAMESPACE
) => `${prefixForward(ns)}:${first}|${second}`;
export const keyTrigramReverse = (
  third: string,
  second: string,
  ns = DEFAULT_NAMESPACE
) => `${prefixReverse(ns)}:${third}|${second}`;

export async function addSentence(
  db: DB,
  sentence: string,
  ns = DEFAULT_NAMESPACE
): Promise<void> {
  log(`adding sentence: "${sentence}"`);

  const lines = sentence.split(sentenceSplitter);
  for (const line of lines) {
    const words = line.split(/\s/gi).map(wordNormalizer).filter(wordFilter);

    /* eslint-disable no-await-in-loop */
    for (let i = 0; i < words.length - 2; i++) {
      const first = words[i];
      const second = words[i + 1];
      const third = words[i + 2];

      const fwdKey = keyTrigramForward(first, second, ns);
      const fwdEntry = await getWithDefault<MarkovEntry>(db, fwdKey, {});
      fwdEntry[third] = (fwdEntry[third] || 0) + 1;
      await db.put<MarkovEntry>(fwdKey, fwdEntry);

      const revKey = keyTrigramReverse(third, second, ns);
      const revEntry = await getWithDefault<MarkovEntry>(db, revKey, {});
      revEntry[first] = (revEntry[first] || 0) + 1;
      await db.put<MarkovEntry>(revKey, revEntry);
    }
    /* eslint-enable no-await-in-loop */
  }
}

export async function initializeMarkov(
  db: DB,
  ns = DEFAULT_NAMESPACE
): Promise<void> {
  const tarotLines: string[] = JSON.parse(
    await fs.readFile(
      path.join(__dirname, "../../../data/corpora.json"),
      "utf8"
    )
  ).tarotLines;

  assert(Array.isArray(tarotLines));
  assert(tarotLines.every((l) => typeof l === "string"));

  for (const line of tarotLines) {
    // eslint-disable-next-line no-await-in-loop
    await addSentence(db, line, ns);
  }
}

export async function getRandomSeed(db: DB, ns = DEFAULT_NAMESPACE) {
  const prefix = prefixForward(ns);
  const gte = prefix + ":";
  const lt = prefix + ";";
  const rs = db.createReadStream<MarkovEntry>({ gte, lt });
  const entries = [];
  for await (const entry of rs) {
    entries.push(entry);
  }

  if (entries.length === 0) {
    await initializeMarkov(db, ns);
    for await (const entry of db.createReadStream<MarkovEntry>({ gte, lt })) {
      entries.push(entry);
    }
    assert(entries.length > 0);
  }

  const res = randomInArray(entries);
  const [first, second] = res.key.slice(gte.length).split("|");
  assert(first && first.length > 0 && second && second.length > 0);
  return {
    first,
    second,
    entry: res.value,
  };
}

export async function getFollowingWords(
  db: DB,
  first: string,
  ns = DEFAULT_NAMESPACE
): Promise<string[]> {
  const prefix = `${prefixForward(ns)}:${first}`;
  const gte = prefix + "|";
  const lt = prefix + "}"; // "}" follows "|" in char code values
  const rs = db.createKeyStream({ gte, lt });
  const keys = [];
  for await (const k of rs) {
    keys.push(k.slice(gte.length));
  }

  return keys;
}

export function getEntry(
  db: DB,
  first: string,
  second: string,
  ns = DEFAULT_NAMESPACE
): Promise<MarkovEntry | null> {
  return getOrNull<MarkovEntry>(db, keyTrigramForward(first, second, ns));
}

export async function getSentence(
  db: DB,
  ns = DEFAULT_NAMESPACE,
  seedFirst?: string,
  seedSecond?: string
): Promise<string> {
  let first = seedFirst;
  let second = seedSecond;
  let entry: MarkovEntry | null = null;
  if (first) {
    if (second) {
      entry = await getEntry(db, first, second, ns);
    }

    // if we don't have a second seed word or if it's not in the db, try to grab
    // a key using only the first seed word
    if (!entry) {
      const nextWords = await getFollowingWords(db, first, ns);
      if (nextWords.length > 0) {
        second = randomInArray(nextWords);
        entry = await getEntry(db, first, second, ns);
        assert(entry !== null);
      }
    }
  }

  // if we don't have a first seed word or one or both the above attempts
  // failed, just get a random starting point
  if (!entry) {
    const seed = await getRandomSeed(db, ns);
    first = seed.first;
    second = seed.second;
    entry = seed.entry;
  }

  const sentence = [first!, second!];

  do {
    const next = randomByWeight(entry);
    sentence.push(next);
    first = second!;
    second = next;
    // eslint-disable-next-line no-await-in-loop
    entry = await getEntry(db, first, second, ns);
  } while (entry && !endTest(sentence));

  return sentence.join(" ");
}

import fs from "fs";
import path from "path";
import assert from "assert";

import debug from "debug";

import { DB } from "../get-db";
import { getWithDefault } from "../db-helpers";

const log = debug("bort-verbose:markov");

export type MarkovEntry = { [followingOrPrecedingWord: string]: number };

const sentenceSplitter = /[.?\n]/gi;
const wordNormalizer = (word: string) => word.toLowerCase();

// TODO: improve?
const wordFilter = (word: string) => word.length > 0 && !word.startsWith("<");

export const DEFAULT_NAMESPACE = "default";

export const keyTrigramForward = (
  namespace: string,
  first: string,
  second: string
) => `markov:${namespace}:${first}|${second}`;
export const keyTrigramReverse = (
  namespace: string,
  third: string,
  second: string
) => `markov-rev:${namespace}:${third}|${second}`;

export async function addSentence(
  db: DB,
  sentence: string,
  namespace = DEFAULT_NAMESPACE
): Promise<void> {
  log(`adding sentence: "${sentence}"`);

  const lines = sentence.split(sentenceSplitter);
  for (const line of lines) {
    const words = line
      .split(/\s/gi)
      .map(wordNormalizer)
      .filter(wordFilter);

    /* eslint-disable no-await-in-loop */
    for (let i = 0; i < words.length - 2; i++) {
      const first = words[i];
      const second = words[i + 1];
      const third = words[i + 2];

      const fwdKey = keyTrigramForward(namespace, first, second);
      const fwdEntry = await getWithDefault<MarkovEntry>(db, fwdKey, {});
      fwdEntry[third] = (fwdEntry[third] || 0) + 1;
      await db.put<MarkovEntry>(fwdKey, fwdEntry);

      const revKey = keyTrigramReverse(namespace, third, second);
      const revEntry = await getWithDefault<MarkovEntry>(db, revKey, {});
      revEntry[first] = (revEntry[first] || 0) + 1;
      await db.put<MarkovEntry>(revKey, revEntry);
    }
    /* eslint-enable no-await-in-loop */
  }
}

export async function initializeMarkov(db: DB): Promise<void> {
  const tarotLines: string[] = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../../../data/corpora.json"), "utf8")
  ).tarotLines;

  assert(Array.isArray(tarotLines));
  assert(tarotLines.every(l => typeof l === "string"));

  for (const line of tarotLines) {
    // eslint-disable-next-line no-await-in-loop
    await addSentence(db, line);
  }
}

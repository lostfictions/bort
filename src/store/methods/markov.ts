import fs from "fs";
import path from "path";
import assert from "assert";

import debug from "debug";

import { DB } from "../get-db";

const log = debug("bort-verbose:markov");

export type MarkovEntry = { [followingOrPrecedingWord: string]: number };

const sentenceSplitter = /[.?\n]/gi;
const wordNormalizer = (word: string) => word.toLowerCase();

// TODO: improve?
const wordFilter = (word: string) => word.length > 0 && !word.startsWith("<");

const keyForward = (word: string) => `markov:${word}`;
const keyReverse = (word: string) => `markov-rev:${word}`;

export async function addSentence(db: DB, sentence: string): Promise<void> {
  log(`adding sentence: "${sentence}"`);

  const lines = sentence.split(sentenceSplitter);
  for (const line of lines) {
    const words = line
      .split(/\s/gi)
      .map(wordNormalizer)
      .filter(wordFilter);

    /* eslint-disable no-await-in-loop */
    for (let i = 0; i < words.length - 1; i++) {
      const word = words[i];
      const nextWord = words[i + 1];

      let forwardEntry;
      let reverseEntry;
      try {
        forwardEntry = await db.get<MarkovEntry>(keyForward(word));
      } catch (e) {
        if (e.notFound) {
          forwardEntry = {} as MarkovEntry;
        } else {
          throw e;
        }
      }

      try {
        reverseEntry = await db.get<MarkovEntry>(keyReverse(nextWord));
      } catch (e) {
        if (e.notFound) {
          reverseEntry = {} as MarkovEntry;
        } else {
          throw e;
        }
      }

      forwardEntry[nextWord] = (forwardEntry[nextWord] || 0) + 1;
      reverseEntry[word] = (reverseEntry[word] || 0) + 1;

      await db.put<MarkovEntry>(keyForward(word), forwardEntry);
      await db.put<MarkovEntry>(keyReverse(nextWord), reverseEntry);
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

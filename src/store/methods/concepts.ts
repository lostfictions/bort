import fs from "fs";
import path from "path";
import assert from "assert";

import { getOrNull } from "../db-helpers.ts";

import type { DB } from "../get-db.ts";

export type Concept = { [entry: string]: number };

const KEY_PREFIX = "concept:";
const KEY_STREAM_TERMINATOR = "concept;";
export const key = (concept: string) => `${KEY_PREFIX}${concept}`;

// TODO: concepts are plain objects -- we should sanitize names like toString, etc.

export async function addConcept(
  db: DB,
  concept: string,
  items?: string[],
  overwrite = false,
): Promise<boolean> {
  const existing = await getOrNull<Concept>(db, key(concept));

  if (existing && !overwrite) return false;

  const c = {} as Concept;
  if (items) {
    for (const i of items) {
      c[i] = 1;
    }
  }
  await db.put<Concept>(key(concept), c);
  return true;
}

export async function removeConcept(db: DB, concept: string): Promise<void> {
  return db.del(key(concept));
}

export async function addToConcept(
  db: DB,
  concept: string,
  items: string[],
): Promise<void> {
  const c = await db.get<Concept>(key(concept));
  for (const i of items) {
    // TODO [-level] replace `in` operator
    // eslint-disable-next-line no-restricted-syntax
    if (!(i in c)) {
      c[i] = 1;
    }
  }
  return db.put<Concept>(key(concept), c);
}

export async function removeFromConcept(
  db: DB,
  concept: string,
  items: string[],
): Promise<boolean> {
  const c = await db.get<Concept>(key(concept));

  for (const item of items) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete c[item];
  }

  await db.put<Concept>(key(concept), c);
  return true;
}

export async function getConcept(
  db: DB,
  concept: string,
): Promise<Concept | false> {
  const existing = await getOrNull<Concept>(db, key(concept));
  return existing ?? false;
}

export async function getConceptList(db: DB): Promise<string[]> {
  const ks = db.createKeyStream({ gte: KEY_PREFIX, lt: KEY_STREAM_TERMINATOR });
  const keys: string[] = [];
  for await (const k of ks) {
    keys.push(k.slice(KEY_PREFIX.length));
  }
  return keys;
}

type Corpora = {
  punc: string[];
  interjection: string[];
  adj: string[];
  noun: string[];
  digit: string[];
  consonant: string[];
  vowel: string[];
  verb: { present: string }[];
};

export async function initializeConcepts(db: DB): Promise<void> {
  const corpora: Corpora = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../../../data/corpora.json"), "utf8"),
  );

  for (const i of [
    "punc",
    "interjection",
    "adj",
    "noun",
    "digit",
    "consonant",
    "vowel",
  ] as const) {
    assert(Array.isArray(corpora[i]));
    corpora[i].every((c: any) => typeof c === "string");
  }

  assert(
    Array.isArray(corpora.verb) &&
      corpora.verb.every((v) => typeof v.present === "string"),
  );

  await addConcept(db, "punc", corpora.punc);
  await addConcept(db, "interjection", corpora.interjection);
  await addConcept(db, "adj", corpora.adj);
  await addConcept(db, "noun", corpora.noun);
  await addConcept(db, "digit", corpora.digit);
  await addConcept(db, "consonant", corpora.consonant);
  await addConcept(db, "vowel", corpora.vowel);
  await addConcept(
    db,
    "verb",
    corpora.verb.map((v) => v.present),
  );
}

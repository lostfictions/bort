import fs from "fs";
import path from "path";
import assert from "assert";

import { DB } from "../get-db";

export type Concept = { [entry: string]: number };

const key = (concept: string) => `concept:${concept}`;

// TODO: concepts are plain objects -- we should sanitize names like toString, etc.

export async function addConcept(
  db: DB,
  concept: string,
  items?: string[],
  overwrite = false
): Promise<boolean> {
  try {
    const existing = await db.get<Concept>(key(concept));
    if (!existing) {
      throw new Error(
        `Key exists, but has falsy value: "${key(concept)}" => "${existing}"`
      );
    }

    if (!overwrite) {
      return false;
    }
  } catch (e) {
    if (!e.notFound) {
      throw e;
    }
  }

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
  items: string[]
): Promise<void> {
  const c = await db.get<Concept>(key(concept));
  for (const i of items) {
    if (!(i in c)) {
      c[i] = 1;
    }
  }
  return db.put<Concept>(key(concept), c);
}

export async function removeFromConcept(
  db: DB,
  concept: string,
  items: string[]
): Promise<boolean> {
  const c = await db.get<Concept>(key(concept));

  for (const item of items) {
    delete c[item];
  }

  await db.put<Concept>(key(concept), c);
  return true;
}

export async function getConcept(
  db: DB,
  concept: string
): Promise<Concept | false> {
  try {
    const existing = await db.get<Concept>(key(concept));
    if (!existing) {
      throw new Error(
        `Key exists, but has falsy value: "${key(concept)}" => "${existing}"`
      );
    }

    return existing;
  } catch (e) {
    if (!e.notFound) {
      throw e;
    }
    return false;
  }
}

export async function initializeConcepts(db: DB): Promise<void> {
  const corpora = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../../../data/corpora.json"), "utf8")
  );

  [
    "punc",
    "interjection",
    "adj",
    "noun",
    "digit",
    "consonant",
    "vowel"
  ].forEach(i => {
    assert(Array.isArray(corpora[i]));
    corpora[i].every((c: any) => typeof c === "string");
  });

  assert(
    Array.isArray(corpora.verb) &&
      corpora.verb.every((v: any) => typeof v.present === "string")
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
    corpora.verb.map((v: { present: string; past: string }) => v.present)
  );
}

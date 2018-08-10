import * as assert from "assert";

import { markovReducers, addSentenceAction } from "../reducers/markov";
import { conceptReducers } from "../reducers/concepts";
import { recentsReducers } from "../reducers/recents";
import { SeenData, seenReducers } from "../reducers/seen";

import { WordBank } from "../components/markov";
import { ConceptBank } from "../commands/concepts";

import { Store, Reducer } from "./store";

interface StoreShape {
  wordBank: WordBank;
  concepts: ConceptBank;

  /**
   * a cache of recent responses to avoid repetition.
   *
   * maps from response -> time sent (in ms from epoch)
   */
  recents: { [uri: string]: number };

  /**
   * maps usernames to a tuple of the last message that user sent
   * and the date it was sent (in ms from epoch)
   */
  seen: { [username: string]: SeenData };
}

export type BortStore = Store<StoreShape>;

let defaultData: StoreShape;
export async function makeStore(dbName: string): Promise<BortStore> {
  if (!defaultData) {
    defaultData = {
      wordBank: getInitialWordbank(),
      concepts: getInitialConcepts(),
      recents: {},
      seen: {}
    };
  }

  const store = new Store({
    dbName,
    reducerTree: {
      wordBank: markovReducers as Reducer,
      concepts: conceptReducers as Reducer,
      recents: recentsReducers as Reducer,
      seen: seenReducers as Reducer
    },
    defaultData
  });

  if (store.initializer) {
    await store.initializer;
  }

  return store;
}

function getInitialWordbank(): WordBank {
  const tarotLines: string[] = require("../../data/corpora").tarotLines;

  return tarotLines.reduce(
    (p, line) => markovReducers(p, addSentenceAction(line)),
    {} as WordBank
  );
}

function getInitialConcepts(): ConceptBank {
  const cb: any = {};

  const corpora = require("../../data/corpora");
  cb["punc"] = corpora.punc;
  cb["interjection"] = corpora.interjection;
  cb["adj"] = corpora.adj;
  cb["noun"] = corpora.noun;
  cb["digit"] = corpora.digit;
  cb["consonant"] = corpora.consonant;
  cb["vowel"] = corpora.vowel;
  cb["verb"] = corpora.verb.map(
    (v: { present: string; past: string }) => v.present
  );

  assert(Array.isArray(cb["punc"]));
  assert(Array.isArray(cb["interjection"]));
  assert(Array.isArray(cb["adj"]));
  assert(Array.isArray(cb["noun"]));
  assert(Array.isArray(cb["digit"]));
  assert(Array.isArray(cb["consonant"]));
  assert(Array.isArray(cb["vowel"]));
  assert(Array.isArray(cb["verb"]));

  return cb;
}

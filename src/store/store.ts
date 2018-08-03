import * as fs from "fs";
import * as path from "path";
import * as assert from "assert";

import { createStore, Store, Reducer } from "redux";
import { combineReducers } from "redux-immutable";
import { fromJS, Map } from "immutable";

import { DATA_DIR } from "../env";

import { markovReducers } from "../reducers/markov";
import { conceptReducers } from "../reducers/concepts";
import { recentsReducers } from "../reducers/recents";
import { seenReducers, SeenData } from "../reducers/seen";

import { WordBank } from "../components/markov";
import { ConceptBank } from "../commands/concepts";

import { addSentenceAction } from "../reducers/markov";

export interface BortStore extends Map<string, any> {
  get(key: "wordBank"): WordBank;
  get(key: "concepts"): ConceptBank;
  /**
   * a cache of recent responses to avoid repetition.
   *
   * maps from response -> time sent (in ms from epoch)
   */
  get(key: "recents"): Map<string, number>;
  /**
   * maps usernames to a tuple of the last message that user sent
   * and the date it was sent (in ms from epoch)
   */
  get(key: "seen"): Map<string, SeenData>;
}

const rootReducer = combineReducers<BortStore>({
  wordBank: markovReducers as Reducer<any>,
  concepts: conceptReducers as Reducer<any>,
  recents: recentsReducers as Reducer<any>,
  seen: seenReducers as Reducer<any>
});

export function makeStore(filename: string = "state"): Store<BortStore> {
  let initialState: BortStore;
  try {
    const p = path.join(DATA_DIR, filename + ".json");
    const d = fs.readFileSync(p).toString();
    const json = JSON.parse(d);

    // Basic sanity check on shape returned
    const props: { [propName: string]: (propValue: any) => any } = {
      wordBank: (_: any) => _,
      concepts: (_: any) => _
    };

    for (const k of Object.keys(props)) {
      assert(props[k](json[k]), `Property ${k} not found in '${p}'!`);
    }

    // short of having a way to migrate a schema, just add this in if it's not
    // present when we load.
    if (!json.recents) {
      json.recents = {};
    }

    initialState = fromJS(json);
    console.log(`Restored state from '${p}'!`);
  } catch (e) {
    console.error(
      `Can't deserialize state! [Error: ${e}]\nRestoring from defaults instead.`
    );
    initialState = Map<string, any>({
      wordBank: getInitialWordbank(),
      concepts: getInitialConcepts(),
      recents: Map<string, number>()
    });
  }

  return createStore<BortStore>(rootReducer, initialState);
}

function getInitialWordbank(): WordBank {
  const tarotLines: string[] = require("../../data/corpora").tarotLines;

  return tarotLines.reduce<WordBank>(
    (p, line) => markovReducers(p, addSentenceAction(line)),
    Map<string, Map<string, number>>()
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

  return fromJS(cb) as ConceptBank;
}

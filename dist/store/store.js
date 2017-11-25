"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const redux_1 = require("redux");
const redux_immutable_1 = require("redux-immutable");
const immutable_1 = require("immutable");
const env_1 = require("../env");
const markov_1 = require("../reducers/markov");
const concepts_1 = require("../reducers/concepts");
const recents_1 = require("../reducers/recents");
const markov_2 = require("../actions/markov");
const assert = require("assert");
const rootReducer = redux_immutable_1.combineReducers({
    wordBank: markov_1.markovReducers,
    concepts: concepts_1.conceptReducers,
    recents: recents_1.recentsReducers
});
function makeStore(filename = 'state') {
    let initialState;
    try {
        const p = path.join(env_1.env.DATA_DIR, filename + '.json');
        const d = fs.readFileSync(p).toString();
        const json = JSON.parse(d);
        // Basic sanity check on shape returned
        const props = {
            wordBank: (p) => p,
            concepts: (p) => p
        };
        // tslint:disable-next-line:forin
        for (const k in props) {
            assert(props[k](json[k]), `Property ${k} not found in '${p}'!`);
        }
        // short of having a way to migrate a schema, just add this in if it's not present
        // when we load.
        if (!json.recents) {
            json.recents = {};
        }
        initialState = immutable_1.fromJS(json);
        console.log(`Restored state from '${p}'!`);
    }
    catch (e) {
        console.error(`Can't deserialize state! [Error: ${e}]\nRestoring from defaults instead.`);
        initialState = immutable_1.Map({
            wordBank: getInitialWordbank(),
            concepts: getInitialConcepts(),
            recents: immutable_1.Map()
        });
    }
    return redux_1.createStore(rootReducer, initialState);
}
exports.makeStore = makeStore;
function getInitialWordbank() {
    const tarotLines = require('../../data/corpora').tarotLines; // tslint:disable-line:no-require-imports
    return tarotLines.reduce((p, line) => markov_1.markovReducers(p, markov_2.addSentenceAction(line)), immutable_1.Map());
}
function getInitialConcepts() {
    const cb = {};
    const corpora = require('../../data/corpora'); // tslint:disable-line:no-require-imports
    cb['punc'] = corpora.punc;
    cb['interjection'] = corpora.interjection;
    cb['adj'] = corpora.adj;
    cb['noun'] = corpora.noun;
    cb['digit'] = corpora.digit;
    cb['consonant'] = corpora.consonant;
    cb['vowel'] = corpora.vowel;
    cb['verb'] = corpora.verb.map((v) => v.present);
    assert(Array.isArray(cb['punc']));
    assert(Array.isArray(cb['interjection']));
    assert(Array.isArray(cb['adj']));
    assert(Array.isArray(cb['noun']));
    assert(Array.isArray(cb['digit']));
    assert(Array.isArray(cb['consonant']));
    assert(Array.isArray(cb['vowel']));
    assert(Array.isArray(cb['verb']));
    return immutable_1.fromJS(cb);
}

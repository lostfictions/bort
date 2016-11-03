"use strict";
const fs = require('fs');
const path = require('path');
const redux_1 = require('redux');
const redux_immutable_1 = require('redux-immutable');
const immutable_1 = require('immutable');
const env_1 = require('../env');
const markov_1 = require('../reducers/markov');
const markov_2 = require('../actions/markov');
const rootReducer = redux_immutable_1.combineReducers({
    wordBank: markov_1.markovReducers
});
function makeStore() {
    let initialState;
    try {
        const d = fs.readFileSync(path.join(env_1.env.OPENSHIFT_DATA_DIR, 'state.json')).toString();
        const json = JSON.parse(d);
        initialState = immutable_1.fromJS(json);
    }
    catch (e) {
        console.error(`Can't deserialize state! [Error: ${e}]\nRestoring from defaults instead.`);
        initialState = immutable_1.Map({
            wordBank: getInitialWordbank(),
        });
    }
    return redux_1.createStore(rootReducer, initialState);
}
exports.makeStore = makeStore;
function getInitialWordbank() {
    const tarotLines = require('../data/corpora').tarotLines;
    return tarotLines.reduce((p, line) => markov_1.markovReducers(p, markov_2.addSentenceAction(line)), immutable_1.Map());
}
// function getInitialConcepts() : ConceptBank {
//   const cb : ConceptBank = {}
//   const corpora = require('../../data/corpora')
//   cb['punc'] = corpora.punc
//   cb['interjection'] = corpora.interjection
//   cb['adj'] = corpora.adj
//   cb['noun'] = corpora.noun
//   cb['vidnite'] = require('../../data/watched.json').singular
//   return cb
// }

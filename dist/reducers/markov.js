"use strict";
const markov_1 = require('../actions/markov');
const immutable_1 = require('immutable');
const sentenceSplitter = /(?:\.|\?|\n)/ig;
const wordNormalizer = (word) => word.toLowerCase();
const wordFilter = (word) => word.length > 0 && !word.startsWith('<');
exports.markovReducers = (state = immutable_1.Map(), action) => {
    if (markov_1.isAddSentenceAction(action)) {
        action.sentence.split(sentenceSplitter).forEach(line => {
            const words = line
                .split(' ')
                .map(wordNormalizer)
                .filter(wordFilter);
            for (let i = 0; i < words.length - 1; i++) {
                const word = words[i];
                const nextWord = words[i + 1];
                state = state.updateIn([word, nextWord], 0, v => v + 1);
            }
        });
    }
    return state;
};

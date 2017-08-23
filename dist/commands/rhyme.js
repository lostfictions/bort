"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chatter_1 = require("chatter");
const util_1 = require("../util/util");
const trace_1 = require("../components/trace");
const cmu = require("cmu-pronouncing-dictionary");
const flipdict = require('../../data/flipdict.json');
const syllableSet = new Set(require('../../data/syllables.json'));
function trim(string) {
    const chars = string.split('');
    const before = [];
    const after = [];
    while (chars.length > 0 && chars[0].match(/[^a-zA-Z]/)) {
        before.push(chars.shift());
    }
    while (chars.length > 0 && chars[chars.length - 1].match(/[^a-zA-Z]/)) {
        after.push(chars.pop());
    }
    return [before.join(''), chars.join(''), after.join('')];
}
/*

From Wikipedia:

A perfect rhyme is a form of rhyme between two words or phrases satisfying the
following conditions:

    The stressed vowel sound in both words must be identical, as well as any
    subsequent sounds. For example, "sky" and "high"; "skylight" and "highlight".

    The articulation that precedes the vowel in the words must differ. For
    example, "bean" and "green" is a perfect rhyme, while "leave" and "believe"
    is not.

*/
exports.default = chatter_1.createCommand({
    name: 'rhyme',
    aliases: ['rap'],
    description: 'bust a rhyme like you never seen / taco beats gonna make you scream'
}, (message, { store }) => {
    const maybeTraced = trace_1.tryTrace(message, store.getState().get('concepts'));
    let prefix = '';
    if (maybeTraced) {
        message = maybeTraced;
        prefix = `(${maybeTraced})\n`;
    }
    if (message.length === 0) {
        return false;
    }
    const words = message.split(' ');
    if (words.length === 0) {
        return false;
    }
    const wb = store.getState().get('wordBank');
    const reply = [];
    for (const word of words) {
        const [before, trimmedWord, after] = trim(word);
        let rhyme = '';
        if (trimmedWord.length > 0) {
            rhyme = getRhymeFor(trimmedWord.toLowerCase());
        }
        if (rhyme === '*') {
            const nexts = wb.get(reply[reply.length - 1]);
            if (nexts != null) {
                rhyme = util_1.randomInArray(nexts.keySeq().toJS());
            }
            else {
                rhyme = util_1.randomInArray(wb.keySeq().toJS());
            }
        }
        reply.push([before, rhyme, after].join(''));
    }
    let joined = reply.join(' ');
    if (joined.length === 0) {
        joined = '¯\\_(ツ)_/¯';
    }
    return prefix + joined;
});
function getRhymeFor(word) {
    const pronounciation = cmu[word];
    if (!pronounciation) {
        //Push a wildcard, for which we'll try to find a candidate from the wordbank in the next step.
        return '*';
    }
    let cursor = flipdict;
    const syllables = pronounciation.toLowerCase().split(' ');
    while (syllables.length > 0) {
        const syll = syllables.pop();
        const isPrimaryStress = syll.endsWith('1');
        const nextCursor = cursor[syll];
        if (!nextCursor) {
            break;
        }
        if (isPrimaryStress) {
            // grab any word from the set that's not the articulation preceding our stress
            // (if there is one)
            const preceding = syllables.pop();
            const validArticulations = Object.keys(nextCursor)
                .filter(a => a !== preceding && syllableSet.has(a));
            // if there's no valid articulations for a perfect rhyme, just pick from lower
            // in the tree.
            if (validArticulations.length > 0) {
                cursor = nextCursor[util_1.randomInArray(validArticulations)];
            }
            while (1) {
                const wordOrSyllable = util_1.randomInArray(Object.keys(cursor));
                if (!syllableSet.has(wordOrSyllable)) {
                    return wordOrSyllable;
                }
                cursor = cursor[wordOrSyllable];
            }
            break;
        }
        cursor = nextCursor;
    }
    return word;
}

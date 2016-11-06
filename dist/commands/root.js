"use strict";
const chatter_1 = require('chatter');
const busey_1 = require('./busey');
const uptime_1 = require('./uptime');
const markov_1 = require('../components/markov');
const concepts_1 = require('./concepts');
// import { default as trace, matcher as traceMatcher } from '../components/minitrace'
const subCommands = [
    concepts_1.conceptAddCommand,
    concepts_1.conceptRemoveCommand,
    busey_1.default,
    uptime_1.default
];
const helpCommand = chatter_1.createCommand({
    name: 'list',
    aliases: ['help', 'usage']
}, (_, { store }) => {
    const concepts = store.getState().get('concepts').keySeq().toJS();
    return '*Commands:*\n' +
        subCommands.map(c => `> *${c.name}* - ${c.description}`).join('\n') + '\n' +
        '*Listens:*\n> ' +
        concepts.filter((c) => c.startsWith('!')).join(', ') + '\n' +
        '*Concepts:*\n> ' +
        concepts.filter((c) => !c.startsWith('!')).join(', ');
});
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ({ store, name }) => chatter_1.createArgsAdjuster({
    adjustArgs: (message) => [message, { store, name }]
}, [
    ...subCommands,
    concepts_1.conceptMatcher,
    helpCommand,
    // If we match nothing, check if we can trace! if not, just return a markov sentence
        (message, { store }) => {
        if (message.length > 0) {
            // if(traceMatcher.test(message)) {
            //   return message.replace(traceMatcher, (_, concept) => trace(state.concepts, concept))
            // }
            const wb = store.getState().get('wordBank');
            const words = message.trim().split(' ').filter(w => w.length > 0);
            if (words.length > 0) {
                const word = words[words.length - 1];
                if (wb.has(word)) {
                    return markov_1.getSentence(wb, word);
                }
            }
        }
        const wb = store.getState().get('wordBank');
        return markov_1.getSentence(wb);
    }
]);

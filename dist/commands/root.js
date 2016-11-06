"use strict";
const chatter_1 = require('chatter');
const busey_1 = require('./busey');
const uptime_1 = require('./uptime');
const markov_1 = require('../components/markov');
const concepts_1 = require('./concepts');
const minitrace_1 = require('../components/minitrace');
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
        const state = store.getState();
        const wb = state.get('wordBank');
        if (message.length > 0) {
            if (minitrace_1.matcher.test(message)) {
                return message.replace(minitrace_1.matcher, (_, concept) => minitrace_1.default(state.get('concepts').toJS(), concept));
            }
            const words = message.trim().split(' ').filter(w => w.length > 0);
            if (words.length > 0) {
                const word = words[words.length - 1];
                if (wb.has(word)) {
                    return markov_1.getSentence(wb, word);
                }
            }
        }
        return markov_1.getSentence(wb);
    }
]);

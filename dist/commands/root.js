"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chatter_1 = require("chatter");
const busey_1 = require("./busey");
const uptime_1 = require("./uptime");
const images_1 = require("./images");
const gifcities_1 = require("./gifcities");
const complete_1 = require("./complete");
const heathcliff_1 = require("./heathcliff");
const concept_load_1 = require("./concept-load");
const concepts_1 = require("./concepts");
const markov_1 = require("../components/markov");
const trace_1 = require("../components/trace");
const markov_2 = require("../actions/markov");
const subCommands = [
    concepts_1.conceptAddCommand,
    concepts_1.conceptRemoveCommand,
    concept_load_1.default,
    concepts_1.conceptListCommand,
    busey_1.default,
    heathcliff_1.default,
    images_1.imageSearchCommand,
    images_1.gifSearchCommand,
    gifcities_1.default,
    complete_1.default,
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
const makeRootCommand = ({ store, name }) => chatter_1.createArgsAdjuster({
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
            if (trace_1.matcher.test(message)) {
                return message.replace(trace_1.matcher, (_, concept) => trace_1.default(state.get('concepts'), concept));
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
function makeMessageHandler(store, name, isDM) {
    const rootCommand = makeRootCommand({ store, name });
    const handleDirectConcepts = (message) => {
        if (!message.startsWith('!')) {
            return false;
        }
        const concepts = store.getState().get('concepts');
        const matchedConcept = concepts.get(message);
        if (matchedConcept != null && matchedConcept.size > 0) {
            return trace_1.default(concepts, message);
        }
        return false;
    };
    // If it's a DM, don't require prefixing with the bot
    // name and don't add any input to our wordbank.
    // Handling the direct concepts first should be safe --
    // it prevents the markov generator fallback of the root
    // command from eating our input.
    if (isDM) {
        return [
            handleDirectConcepts,
            rootCommand
        ];
    }
    // Otherwise, it's a public channel message.
    return [
        chatter_1.createCommand({
            isParent: true,
            name: name,
            // name: botNames.name,
            // aliases: botNames.aliases,
            description: `it ${name}`
        }, rootCommand),
        handleDirectConcepts,
        // If we didn't match anything, add to our markov chain.
        (message) => {
            if (message.length > 0 && message.split(' ').length > 1) {
                store.dispatch(markov_2.addSentenceAction(message));
            }
            return false;
        }
    ];
}
exports.default = makeMessageHandler;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chatter_1 = require("chatter");
const concept_1 = require("../actions/concept");
// Match two groups:
// 1: a bracket-delimited term of any length
// 2: the rest of the message if there is any, ignoring any preceding whitespace
const matcher = /^\[([^\[\]]+)\](?:$|\s+(.*))/g; // eslint-disable-line no-useless-escape
exports.conceptAddCommand = chatter_1.createCommand({
    name: 'add',
    aliases: ['+'],
    description: 'add a new concept'
}, (message, { store }) => {
    if (message.length === 0) {
        return false;
    }
    const concepts = store.getState().get('concepts');
    if (concepts.has(message)) {
        return `Concept "${message}" already exists!`;
    }
    store.dispatch(concept_1.addConceptAction(message));
    return `Okay! Added a concept named "${message}".`;
});
exports.conceptRemoveCommand = chatter_1.createCommand({
    name: 'remove',
    aliases: ['delete', '-'],
    description: 'delete an existing concept'
}, (message, { store }) => {
    if (message.length === 0) {
        return false;
    }
    const concepts = store.getState().get('concepts');
    if (!concepts.has(message)) {
        return `Concept "${message}" doesn't exist!`;
    }
    store.dispatch(concept_1.removeConceptAction(message));
    return `Okay! Deleted concept "${message}".`;
});
exports.conceptListCommand = chatter_1.createCommand({
    name: 'list',
    aliases: ['get'],
    description: 'list everything in a concept'
}, (message, { store }) => {
    if (message.length === 0) {
        return false;
    }
    const concepts = store.getState().get('concepts');
    if (!concepts.has(message)) {
        return `Concept "${message}" doesn't exist!`;
    }
    const items = concepts.get(message);
    if (items.size > 100) {
        return `"${message}" has ${items.size} items in it! Only showing the first 100.\n` +
            items.slice(0, 100).join(', ');
    }
    return `*${message}:*\n` + (items.size > 0 ? items.join(', ') : '_Empty._');
});
// We could probably come up with a better naming scheme, but:
// the commands above are used to add and remove and list top-level
// concepts, while the commands below add and remove the
// contents of individual concepts.
const conceptAddToCommand = chatter_1.createCommand({
    name: 'add',
    aliases: ['+'],
    description: 'add to a concept'
}, (message, concept, store) => {
    if (message.length === 0) {
        return false;
    }
    const concepts = store.getState().get('concepts');
    if (concepts.get(concept).indexOf(message) !== -1) {
        return `"${message}" already exists in "${concept}"!`;
    }
    store.dispatch(concept_1.addToConceptAction(concept, message));
    return `Okay! Added "${message}" to "${concept}".`;
});
const conceptRemoveFromCommand = chatter_1.createCommand({
    name: 'remove',
    aliases: ['delete', '-'],
    description: 'remove from a concept'
}, (message, concept, store) => {
    if (message.length === 0) {
        return false;
    }
    const concepts = store.getState().get('concepts');
    if (concepts.get(concept).indexOf(message) === -1) {
        return `"${message}" doesn't exist in "${concept}"!`;
    }
    store.dispatch(concept_1.removeFromConceptAction(concept, message));
    return `Okay! Removed "${message}" from "${concept}".`;
});
// The conceptMatcher matches commands that start with a concept,
// adjusts the arguments to include the normalized concept in question
// and removes it from the message, and then redirects to one of the
// commands above.
exports.conceptMatcher = chatter_1.createMatcher({
    match: (message, { store }) => {
        if (message.length === 0) {
            return false;
        }
        // The matcher will match concepts/commands either in the format
        // "adj add humongous" OR "[adj] add humongous".
        // This lets us match concepts that contain whitespace
        // like "[kind of animal]", as well as concepts that might
        // otherwise be processed as a keyword or command, like "[delete]".
        // We try matching against the "matcher" regex above, then
        // normalize the results.
        let matches = message.match(matcher);
        if (matches == undefined) {
            const split = message.split(' ');
            matches = ['', split[0], split.slice(1).join(' ')];
        }
        const [, concept, command] = matches;
        const concepts = store.getState().get('concepts');
        if (!concepts.has(concept)) {
            return false;
        }
        return concept + ' ' + command;
    }
}, chatter_1.createArgsAdjuster({
    adjustArgs: (message, { store }) => {
        const split = message.split(' ');
        const concept = split[0];
        const adjustedMessage = split.slice(1).join(' ');
        return [adjustedMessage, concept, store];
    }
}, [
    conceptAddToCommand,
    conceptRemoveFromCommand
]));
//# sourceMappingURL=concepts.js.map
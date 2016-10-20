"use strict";
const chatter_1 = require('chatter');
const minitrace_1 = require('./minitrace');
const corpora = require('./corpora');
exports.concepts = corpora;
exports.conceptAddCommand = chatter_1.createCommand({
    name: 'add',
    aliases: ['+'],
    description: 'add a new concept'
}, (message) => {
    if (message.length === 0) {
        return false;
    }
    if (exports.concepts.hasOwnProperty(message)) {
        return `Concept "${message}" already exists!`;
    }
    exports.concepts[message] = [];
    return `Okay! Added a concept named "${message}".`;
});
exports.conceptRemoveCommand = chatter_1.createCommand({
    name: 'remove',
    aliases: ['delete', '-'],
    description: 'delete an existing concept'
}, (message) => {
    if (message.length === 0) {
        return false;
    }
    if (!exports.concepts.hasOwnProperty(message)) {
        return `Concept "${message}" doesn't exist!`;
    }
    delete exports.concepts[message];
    return `Okay! Deleted concept "${message}".`;
});
exports.conceptListCommand = chatter_1.createCommand({
    name: 'list',
    aliases: ['get'],
    description: 'list all concepts'
}, (message) => 'Concepts:\n' + Object.keys(exports.concepts).join(', ') || 'None.');
// We could probably come up with a better naming scheme, but:
// the commands above are used to add, remove and list top-level
// concepts, while the commands below add, remove and list the
// contents of individual concepts.
exports.conceptAddToCommand = chatter_1.createCommand({
    name: 'add',
    aliases: ['+'],
    description: 'add to a concept'
}, (message, concept) => {
    if (message.length === 0) {
        return false;
    }
    if (exports.concepts[concept].indexOf(message) !== -1) {
        return `"${message}" already exists in "${concept}"!`;
    }
    exports.concepts[concept].push(message);
    return `Okay! Added "${message}" to "${concept}".`;
});
exports.conceptRemoveFromCommand = chatter_1.createCommand({
    name: 'remove',
    aliases: ['delete', '-'],
    description: 'remove from a concept'
}, (message, concept) => {
    if (message.length === 0) {
        return false;
    }
    const index = exports.concepts[concept].indexOf(message);
    if (index === -1) {
        return `"${message}" doesn't exist in "${concept}"!`;
    }
    exports.concepts[concept].splice(index, 1);
    return `Okay! Removed "${message}" from "${concept}".`;
});
exports.conceptListOneCommand = chatter_1.createCommand({
    name: 'list',
    aliases: ['get'],
    description: 'list everything in a concept'
}, (message, concept) => {
    if (message.length > 0) {
        return false;
    }
    return concept + ':\n' + exports.concepts[concept].join(', ') || 'Empty.';
});
exports.conceptGetRandom = (message, concept) => {
    if (message.length > 0) {
        return false;
    }
    return minitrace_1.default(exports.concepts, concept);
};
// Match two groups:
// 1: a bracket-delimited term of any length
// 2: the rest of the message if there is any, ignoring any preceding whitespace
exports.matcher = /^\[([^\[\]]+)\](?:$|\s+(.*))/g;
// The conceptMatcher matches commands that start with a concept,
// adjusts the arguments to include the normalized concept in question
// and removes it from the message, and then redirects to one of the
// commands above.
exports.conceptMatcher = chatter_1.createMatcher({
    match: (message) => {
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
        let matches = message.match(exports.matcher); //tslint:disable-line:no-null-keyword
        if (matches == undefined) {
            const split = message.split(' ');
            matches = ['', split[0], split.slice(1).join(' ')];
        }
        const [, concept, command] = matches;
        if (!exports.concepts.hasOwnProperty(concept)) {
            return false;
        }
        return concept + ' ' + command;
    }
}, chatter_1.createArgsAdjuster({
    adjustArgs: (message) => {
        const split = message.split(' ');
        const concept = split[0];
        const adjustedMessage = split.slice(1).join(' ');
        return [adjustedMessage, concept];
    }
}, [
    exports.conceptAddToCommand,
    exports.conceptRemoveFromCommand,
    exports.conceptListOneCommand,
    exports.conceptGetRandom
]));
exports.conceptCommand = chatter_1.createCommand({
    name: 'concept',
    aliases: ['c', 'con'],
    description: 'give me some ideas'
}, [
    exports.conceptAddCommand,
    exports.conceptRemoveCommand,
    exports.conceptListCommand,
    exports.conceptMatcher
]);

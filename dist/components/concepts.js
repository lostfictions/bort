"use strict";
const chatter_1 = require('chatter');
const minitrace_1 = require('./minitrace');
// Match two groups:
// 1: a bracket-delimited term of any length
// 2: the rest of the message if there is any, ignoring any preceding whitespace
const matcher = /^\[([^\[\]]+)\](?:$|\s+(.*))/g;
function makeConceptCommand(concepts) {
    const conceptAddCommand = chatter_1.createCommand({
        name: 'add',
        aliases: ['+'],
        description: 'add a new concept'
    }, (message) => {
        if (message.length === 0) {
            return false;
        }
        if (concepts.hasOwnProperty(message)) {
            return `Concept "${message}" already exists!`;
        }
        concepts[message] = [];
        return `Okay! Added a concept named "${message}".`;
    });
    const conceptRemoveCommand = chatter_1.createCommand({
        name: 'remove',
        aliases: ['delete', '-'],
        description: 'delete an existing concept'
    }, (message) => {
        if (message.length === 0) {
            return false;
        }
        if (!concepts.hasOwnProperty(message)) {
            return `Concept "${message}" doesn't exist!`;
        }
        delete concepts[message];
        return `Okay! Deleted concept "${message}".`;
    });
    const conceptListCommand = chatter_1.createCommand({
        name: 'list',
        aliases: ['get'],
        description: 'list all concepts'
    }, (message) => 'Concepts:\n' + Object.keys(concepts).join(', ') || 'None.');
    // We could probably come up with a better naming scheme, but:
    // the commands above are used to add, remove and list top-level
    // concepts, while the commands below add, remove and list the
    // contents of individual concepts.
    const conceptAddToCommand = chatter_1.createCommand({
        name: 'add',
        aliases: ['+'],
        description: 'add to a concept'
    }, (message, concept) => {
        if (message.length === 0) {
            return false;
        }
        if (concepts[concept].indexOf(message) !== -1) {
            return `"${message}" already exists in "${concept}"!`;
        }
        concepts[concept].push(message);
        return `Okay! Added "${message}" to "${concept}".`;
    });
    const conceptRemoveFromCommand = chatter_1.createCommand({
        name: 'remove',
        aliases: ['delete', '-'],
        description: 'remove from a concept'
    }, (message, concept) => {
        if (message.length === 0) {
            return false;
        }
        const index = concepts[concept].indexOf(message);
        if (index === -1) {
            return `"${message}" doesn't exist in "${concept}"!`;
        }
        concepts[concept].splice(index, 1);
        return `Okay! Removed "${message}" from "${concept}".`;
    });
    const conceptListOneCommand = chatter_1.createCommand({
        name: 'list',
        aliases: ['get'],
        description: 'list everything in a concept'
    }, (message, concept) => {
        if (message.length > 0) {
            return false;
        }
        return concept + ':\n' + concepts[concept].join(', ') || 'Empty.';
    });
    const conceptGetRandom = (message, concept) => {
        if (message.length > 0) {
            return false;
        }
        return minitrace_1.default(concepts, concept);
    };
    // The conceptMatcher matches commands that start with a concept,
    // adjusts the arguments to include the normalized concept in question
    // and removes it from the message, and then redirects to one of the
    // commands above.
    const conceptMatcher = chatter_1.createMatcher({
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
            let matches = message.match(matcher);
            if (matches == undefined) {
                const split = message.split(' ');
                matches = ['', split[0], split.slice(1).join(' ')];
            }
            const [, concept, command] = matches;
            if (!concepts.hasOwnProperty(concept)) {
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
        conceptAddToCommand,
        conceptRemoveFromCommand,
        conceptListOneCommand,
        conceptGetRandom
    ]));
    return chatter_1.createCommand({
        name: 'concept',
        aliases: ['c', 'con'],
        description: 'give me some ideas',
        isParent: true
    }, [
        conceptAddCommand,
        conceptRemoveCommand,
        conceptListCommand,
        conceptMatcher
    ]);
}
exports.makeConceptCommand = makeConceptCommand;

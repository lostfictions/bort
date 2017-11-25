"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../util");
exports.matcher = /\[([^\[\]]+)\]/g; // eslint-disable-line no-useless-escape
const isVowel = (char) => /^[aeiou]$/i.test(char);
// TODO: filter length 0 before passing through to simplify all of these
exports.defaultModifiers = {
    s: word => {
        if (word.length < 1)
            return word;
        switch (word[word.length - 1].toLowerCase()) {
            case 's':
            case 'h':
            case 'x':
                return word + 'es';
            case 'y':
                return !isVowel(word[word.length - 2])
                    ? word.substring(0, word.length - 1) + 'ies'
                    : word + 's';
            default:
                return word + 's';
        }
    },
    a: word => {
        switch (true) {
            case word.length < 1:
                return word;
            case word[0].toLowerCase() === 'u' && word.length > 2 && word[2].toLowerCase() === 'i':
                return 'a ' + word;
            case isVowel(word[0]):
                return 'an ' + word;
            default:
                return 'a ' + word;
        }
    },
    ed: word => {
        if (word.length < 1)
            return word;
        switch (word[word.length - 1]) {
            case 'e':
                return word + 'd';
            case 'y':
                return word.length > 1 && !isVowel(word[word.length - 2])
                    ? word.substring(0, word.length - 1) + 'ied'
                    : word + 'd';
            default:
                return word + 'ed';
        }
    },
    ing: word => {
        if (word.length < 1)
            return word;
        if (word[word.length - 1].toLowerCase() === 'e') {
            return word.substring(0, word.length - 1) + 'ing';
        }
        return word + 'ing';
    },
    upper: word => word.toUpperCase(),
    cap: word => word.length > 0 ? word[0].toUpperCase() + word.substring(1) : '',
    swap: (word, search, replacement) => word.split(search).join(replacement)
};
exports.defaultModifiers['an'] = exports.defaultModifiers['a'];
exports.defaultModifiers['es'] = exports.defaultModifiers['s'];
function trace({ concepts, concept, maxCycles = 10, seen = {}, modifierList = exports.defaultModifiers }) {
    const [resolvedConcept, ...modifierChunks] = concept.split('|');
    const modifiers = modifierChunks
        .map(chunk => {
        const [modifierName, ...args] = chunk.split(' ');
        return [modifierList[modifierName], args];
    })
        .filter(resolved => resolved[0]);
    if (!concepts.has(resolvedConcept)) {
        return `{error: unknown concept "${resolvedConcept}"}`;
    }
    const traceResult = util_1.randomInRange(concepts.get(resolvedConcept))
        .replace(exports.matcher, (_, nextConcept) => {
        if (seen[nextConcept] > maxCycles) {
            return '{error: max cycles exceeded}';
        }
        const nextSeen = Object.assign({}, seen);
        nextSeen[nextConcept] = nextSeen[nextConcept] + 1 || 1;
        return trace({
            concepts,
            concept: nextConcept,
            maxCycles,
            seen: nextSeen
        });
    });
    return modifiers.reduce((result, m) => m[0](result, ...m[1]), traceResult);
}
exports.default = trace;
function tryTrace(message, concepts) {
    if (exports.matcher.test(message)) {
        return message.replace(exports.matcher, (_, concept) => trace({ concepts, concept }));
    }
    return false;
}
exports.tryTrace = tryTrace;

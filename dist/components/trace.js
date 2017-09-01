"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../util/util");
exports.matcher = /\[([^\[\]]+)\]/g;
const isVowel = (char) => /^[aeiou]$/i.test(char);
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
    ed: s => {
        if (s.length < 1)
            return s;
        switch (s[s.length - 1]) {
            case 'e':
                return s + 'd';
            case 'y':
                return s.length > 1 && !isVowel(s[s.length - 2])
                    ? s.substring(0, s.length - 1) + 'ied'
                    : s + 'd';
            default:
                return s + 'ed';
        }
    }
};
exports.defaultModifiers['an'] = exports.defaultModifiers['a'];
exports.defaultModifiers['es'] = exports.defaultModifiers['s'];
function trace({ concepts, concept, maxCycles = 10, seen = {}, modifierList = exports.defaultModifiers }) {
    const [resolvedConcept, ...modifierNames] = concept.split('|');
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
    return modifierNames.reduce((result, m) => (modifierList[m] || (a => a))(result), traceResult);
}
exports.default = trace;
function tryTrace(message, concepts) {
    if (exports.matcher.test(message)) {
        return message.replace(exports.matcher, (_, concept) => trace({ concepts, concept: concept }));
    }
    return false;
}
exports.tryTrace = tryTrace;

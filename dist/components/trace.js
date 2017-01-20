"use strict";
const util_1 = require("../util/util");
exports.matcher = /\[([^\[\]]+)\]/g;
function trace(concepts, concept, maxCycles = 10, seen = {}) {
    if (!concepts.has(concept)) {
        return `{error: unknown concept "${concept}"}`;
    }
    return util_1.randomInRange(concepts.get(concept))
        .replace(exports.matcher, (_, nextConcept) => {
        if (seen[nextConcept] > maxCycles) {
            return '{error: max cycles exceeded}';
        }
        const nextSeen = Object.assign({}, seen);
        nextSeen[nextConcept] = nextSeen[nextConcept] + 1 || 1;
        return trace(concepts, nextConcept, maxCycles, nextSeen);
    });
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = trace;

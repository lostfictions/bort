"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chatter_1 = require("chatter");
const util_1 = require("../util/util");
exports.default = chatter_1.createCommand({
    name: 'busey',
    aliases: ['acronym'],
    description: 'make buseyisms'
}, (message, { store }) => {
    const wb = store.getState().get('wordBank');
    const letters = message.toLowerCase().split('').filter(char => /[A-Za-z]/.test(char));
    const acro = [];
    let lastWord = null;
    for (const l of letters) {
        let candidates = null;
        // First, try to find something that follows from our previous word
        if (lastWord) {
            const nexts = wb.get(lastWord);
            if (nexts != null) {
                candidates = nexts.keySeq().filter(word => word != null && word.startsWith(l)).toJS();
            }
        }
        // Otherwise, just grab a random word that matches our letter
        if (candidates == null || candidates.length === 0) {
            candidates = wb.keySeq().filter(word => word != null && word.startsWith(l)).toJS();
        }
        if (candidates != null && candidates.length > 0) {
            lastWord = util_1.randomInArray(candidates);
            acro.push(lastWord);
        }
    }
    // Capitalize each word and join them into a string.
    if (acro.length > 0) {
        return acro.map(word => word[0].toUpperCase() + word.slice(1)).join(' ');
    }
    return 'Please Inspect Senseless Sentences';
});

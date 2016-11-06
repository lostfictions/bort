"use strict";
const chatter_1 = require('chatter');
const util_1 = require('../util/util');
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = new chatter_1.CommandMessageHandler({
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
            candidates = wb.get(lastWord).keySeq().filter(word => word != null && word.startsWith(l)).toJS();
        }
        // Otherwise, just grab a random word that matches our letter
        if (candidates == null || candidates.length === 0) {
            candidates = wb.keySeq().filter(word => word != null && word.startsWith(l)).toJS();
        }
        if (candidates != null && candidates.length > 0) {
            acro.push(util_1.randomInArray(candidates));
        }
    }
    // Capitalize each word and join them into a string.
    return acro.map(word => word[0].toUpperCase() + word.slice(1)).join(' ');
});

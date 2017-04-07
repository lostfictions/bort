"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chatter_1 = require("chatter");
const got = require("got");
const markov_1 = require("../components/markov");
exports.default = chatter_1.createCommand({
    name: 'complete',
    aliases: ['tell me'],
    description: "we know each other so well we finish each other's sentences"
}, (message, { store }) => {
    if (message.length === 0) {
        return false;
    }
    return got(`https://suggestqueries.google.com/complete/search`, {
        query: { q: message, client: 'firefox' },
        timeout: 5000
    })
        .then(res => {
        if (res.body.length > 0) {
            const parsed = JSON.parse(res.body);
            if (parsed[1] && parsed[1].length && parsed[1].length > 0) {
                return parsed[1].join('\n');
            }
        }
        // if there's no completion, just return a random markov
        const wb = store.getState().get('wordBank');
        const words = message.trim().split(' ').filter(w => w.length > 0);
        if (words.length > 0) {
            const word = words[words.length - 1];
            if (wb.has(word)) {
                return markov_1.getSentence(wb, word);
            }
        }
        return markov_1.getSentence(wb);
    });
});

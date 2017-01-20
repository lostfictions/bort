"use strict";
const chatter_1 = require("chatter");
const got = require("got");
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = chatter_1.createCommand({
    name: 'complete',
    aliases: ['tell me'],
    description: "we know each other so well we finish each other's sentences"
}, (message) => {
    if (message.length === 0) {
        return false;
    }
    return got(`https://suggestqueries.google.com/complete/search`, {
        query: { q: message, client: 'firefox' },
        timeout: 5000
    })
        .then(res => JSON.parse(res.body)[1].join('\n'));
});

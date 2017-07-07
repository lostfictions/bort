"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chatter_1 = require("chatter");
const got = require("got");
const trace_1 = require("../components/trace");
exports.default = chatter_1.createCommand({
    name: 'complete',
    aliases: ['tell me'],
    description: "we know each other so well we finish each other's sentences"
}, (message, { store }) => {
    if (message.length === 0) {
        return false;
    }
    const maybeTraced = trace_1.tryTrace(message, store.getState().get('concepts'));
    return got(`https://suggestqueries.google.com/complete/search`, {
        query: { q: maybeTraced || message, client: 'firefox' },
        timeout: 5000
    })
        .then(res => {
        let prefix = '';
        if (maybeTraced) {
            prefix = `(${maybeTraced})\n`;
        }
        if (res.body.length > 0) {
            const parsed = JSON.parse(res.body);
            if (parsed[1] && parsed[1].length && parsed[1].length > 0) {
                return prefix + parsed[1].join('\n');
            }
        }
        return prefix + '¯\\_(ツ)_/¯';
    });
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chatter_1 = require("chatter");
const got = require("got");
const util_1 = require("../util");
const trace_1 = require("../components/trace");
exports.default = chatter_1.createCommand({
    name: 'gifcities',
    aliases: ['geocities'],
    description: 'geocities classix'
}, (message, { store }) => {
    if (message.length === 0) {
        return false;
    }
    const maybeTraced = trace_1.tryTrace(message, store.getState().get('concepts'));
    if (maybeTraced) {
        return doQuery(maybeTraced).then(res => `(${maybeTraced})\n${res}`);
    }
    return doQuery(message);
});
function doQuery(query) {
    return got(`https://gifcities.archive.org/api/v1/gifsearch`, {
        query: { q: query, limit: 5 },
        timeout: 5000
    })
        .then(res => util_1.randomInArray(JSON.parse(res.body).map((g) => 'https://web.archive.org/web/' + g.gif)));
}
//# sourceMappingURL=gifcities.js.map
"use strict";
const chatter_1 = require('chatter');
const got = require('got');
const util_1 = require('../util/util');
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = chatter_1.createCommand({
    name: 'gifsearch',
    aliases: ['gif me the', 'gif me a', 'gif me', 'gif'],
    description: 'geocities classix'
}, (message) => {
    if (message.length === 0) {
        return false;
    }
    return got(`https://gifcities.archive.org/api/v1/gifsearch`, {
        query: { q: message, limit: 5 },
        timeout: 5000
    })
        .then(res => util_1.randomInArray(JSON.parse(res.body).map((g) => 'https://web.archive.org/web/' + g.gif)));
});

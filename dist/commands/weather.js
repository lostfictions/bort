"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chatter_1 = require("chatter");
const got = require("got");
exports.default = chatter_1.createCommand({
    name: 'weather',
    description: 'rain or shine'
}, (message, { store }) => {
    if (message.length === 0) {
        return false;
    }
    return got(`http://wttr.in/${message}?q0T`, {
        timeout: 5000,
        headers: {
            'User-Agent': 'curl'
        }
    })
        .then(res => '```' + res.body + '```');
});
//# sourceMappingURL=weather.js.map
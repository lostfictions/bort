"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const readline = require("readline");
const chatter_1 = require("chatter");
const get_store_1 = require("../store/get-store");
const root_1 = require("../commands/root");
const simulate = (messageHandler, message) => chatter_1.processMessage(messageHandler, message)
    .then(response => {
    const text = response !== false ? chatter_1.normalizeMessage(response) : '-';
    console.log(text);
});
exports.makeCLIBot = (botName) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    const testBot = root_1.default(get_store_1.getStore('test'), botName, false);
    rl.on('line', (input) => simulate(testBot, input));
    return testBot;
};
//# sourceMappingURL=cli.js.map
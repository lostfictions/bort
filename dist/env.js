"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const envalid = require("envalid");
exports.env = envalid.cleanEnv(process.env, {
    BOT_NAME: envalid.str({ default: 'bort' }),
    DATA_DIR: envalid.str({ default: 'persist' }),
    SLACK_TOKENS: envalid.str({
        default: '',
        desc: 'A Slack API token, or a comma-separated list of Slack API tokens.'
    }),
    DISCORD_TOKEN: envalid.str({ default: '' }),
    HOSTNAME: envalid.str({ devDefault: 'localhost' }),
    PORT: envalid.num({ devDefault: 8080 }),
    USE_CLI: envalid.bool({
        default: false,
        desc: 'Start up an interface that reads from stdin and prints to stdout instead of connecting to servers.'
    })
}, { strict: true });
if (!fs.existsSync(exports.env.DATA_DIR)) {
    console.log(exports.env.DATA_DIR + ' not found! creating.');
    fs.mkdirSync(exports.env.DATA_DIR);
}
const isValidConfiguration = exports.env.USE_CLI ||
    exports.env.SLACK_TOKENS ||
    exports.env.DISCORD_TOKEN;
if (!isValidConfiguration) {
    console.warn(`Environment configuration doesn't appear to be valid! Bot will do nothing if you're not running in CLI mode.`);
    const configInfo = Object.entries({
        'Slack': exports.env.SLACK_TOKENS ? 'OK' : 'NONE',
        'Discord': exports.env.DISCORD_TOKEN ? 'OK' : 'NONE'
    }).map(tuple => tuple.join(': ')).join('\n');
    console.log(configInfo);
}

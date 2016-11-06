"use strict";
const os_1 = require('os');
const moment = require('moment');
const chatter_1 = require('chatter');
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = chatter_1.createCommand({
    name: 'uptime',
    description: 'info about me'
}, (_, { name }) => {
    const uptime = moment.duration(process.uptime(), 'seconds').humanize();
    return `hi its me <@${name}> i have been here for *${uptime}* via \`${os_1.hostname()}\``;
});

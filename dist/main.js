"use strict";
const readline = require("readline");
const os_1 = require("os");
const client_1 = require("@slack/client");
const discord_js_1 = require("discord.js");
const chatter_1 = require("chatter");
const store_1 = require("./store/store");
const root_1 = require("./commands/root");
const env_1 = require("./env");
const minimist = require("minimist");
const argv = minimist(process.argv.slice(2));
const pingserver_1 = require("./components/pingserver");
pingserver_1.pingserver(env_1.env.OPENSHIFT_NODEJS_PORT, env_1.env.OPENSHIFT_NODEJS_IP);
const bpfStore = store_1.makeStore('bpf');
const slStore = store_1.makeStore('sl');
/////////////
// Serialize on all state changes!
const path = require("path");
const fs = require("fs");
bpfStore.subscribe(() => {
    const p = path.join(env_1.env.OPENSHIFT_DATA_DIR, 'bpf.json');
    fs.writeFile(p, JSON.stringify(bpfStore.getState()), (e) => {
        if (e) {
            console.error(`Couldn't write state to ${p}: [${e}]`);
        }
        else {
            console.log(`Wrote state to '${p}'!`);
        }
    });
});
slStore.subscribe(() => {
    const p = path.join(env_1.env.OPENSHIFT_DATA_DIR, 'sl.json');
    fs.writeFile(p, JSON.stringify(slStore.getState()), (e) => {
        if (e) {
            console.error(`Couldn't write state to ${p}: [${e}]`);
        }
        else {
            console.log(`Wrote state to '${p}'!`);
        }
    });
});
/////////////
const botName = argv['name'] || 'bort';
if (argv['test']) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    const simulate = (messageHandler, message) => chatter_1.processMessage(messageHandler, message)
        .then(response => {
        const text = response !== false ? chatter_1.normalizeMessage(response) : '-';
        console.log(text);
    });
    // .catch(reason => console.log(`Uhhh... ${reason}`))
    const testBot = root_1.default(bpfStore, botName, false);
    rl.on('line', (input) => simulate(testBot, input));
}
else {
    //tslint:disable:no-invalid-this
    const bpfBot = new chatter_1.SlackBot({
        name: botName,
        // Override the message posting options so that we simply post as our bot user
        postMessageOptions: (text) => ({
            text,
            as_user: false,
            username: botName,
            icon_url: 'http://' + env_1.env.OPENSHIFT_APP_DNS + '/bort.png',
            unfurl_links: true,
            unfurl_media: true
        }),
        getSlack: function () {
            const rtm = new client_1.RtmClient(env_1.env.SLACK_TOKEN, {
                dataStore: new client_1.MemoryDataStore(),
                autoReconnect: true,
                logLevel: 'error'
            });
            // Post a message to all the channels we belong to.
            const b = this;
            rtm.on('open', function () {
                const cs = this.dataStore.channels;
                Object.keys(cs)
                    .filter(c => cs[c].is_member && !cs[c].is_archived)
                    .forEach(c => b.postMessage(c, `${b.name} (on \`${os_1.hostname()}\`)`));
            });
            return {
                rtmClient: rtm,
                webClient: new client_1.WebClient(env_1.env.SLACK_TOKEN)
            };
        },
        createMessageHandler: function (id, meta) {
            return root_1.default(bpfStore, this.name, meta.channel.is_im);
        }
    });
    //tslint:enable:no-invalid-this
    bpfBot.login();
    const slClient = new discord_js_1.Client();
    const slBot = new chatter_1.Bot({
        createMessageHandler: function (id, meta) {
            return root_1.default(bpfStore, botName, meta.message.channel.type === 'dm');
        },
        getMessageHandlerArgs: function (message) {
            if (message.author.bot) {
                return false;
            }
            // Ignore non-message messages.
            if (message.type !== 'DEFAULT') {
                console.log(`Ignoring message type "${message.type}"`);
                return false;
            }
            const user = message.author;
            const meta = {
                bot: this,
                client: slClient,
                message,
                user
            };
            return {
                text: message.content,
                args: [meta]
            };
        },
        getMessageHandlerCacheId: function (meta) {
            return meta.message.channel.id;
        },
        sendResponse: function (message, text) {
            message.channel.sendMessage(text);
        }
    });
    slClient.on('ready', () => {
        const cs = slClient.channels.array();
        cs.forEach(c => c.sendMessage && c.sendMessage(`${botName} (on \`${os_1.hostname()}\`)`));
    });
    slClient.on('message', slBot.onMessage.bind(slBot));
    slClient.login(env_1.env.DISCORD_TOKEN);
}

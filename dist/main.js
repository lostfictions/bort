"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const readline = require("readline");
const client_1 = require("@slack/client");
const discord_js_1 = require("discord.js");
const chatter_1 = require("chatter");
const store_1 = require("./store/store");
const root_1 = require("./commands/root");
const recents_1 = require("./actions/recents");
const env_1 = require("./env");
const minimist = require("minimist");
const argv = minimist(process.argv.slice(2));
const pingserver_1 = require("./components/pingserver");
const path = require("path");
const fs = require("fs");
pingserver_1.pingserver(env_1.env.PORT);
const stores = {};
const getStore = id => {
    if (id.length < 1) {
        throw new Error('Invalid id for store!');
    }
    if (id in stores) {
        return stores[id];
    }
    const s = store_1.makeStore(id);
    // Serialize on all state changes!
    // Probably doesn't scale, but good enough for now
    // This is also reliant on the filename logic in makeStore()
    // staying the same. TODO
    s.subscribe(() => {
        const p = path.join(env_1.env.DATA_DIR, id + '.json');
        fs.writeFile(p, JSON.stringify(s.getState()), (e) => {
            if (e) {
                console.error(`Couldn't write state to ${p}: [${e}]`);
            }
            else {
                // console.log(`Wrote state to '${ p }'!`)
            }
        });
    });
    setInterval(() => s.dispatch(recents_1.cleanRecentsAction()), 60000);
    stores[id] = s;
    return s;
};
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
    const testBot = root_1.default(getStore('test'), botName, false);
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
            icon_url: 'http://' + env_1.env.HOSTNAME + '/bort.png',
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
            // const b = this
            // rtm.on('open', function() : void {
            //   const cs = this.dataStore.channels
            //   Object.keys(cs)
            //     .filter(c => cs[c].is_member && !cs[c].is_archived)
            //     .forEach(c => b.postMessage(c, `${b.name} (on \`${hostname()}\`)`))
            // })
            return {
                rtmClient: rtm,
                webClient: new client_1.WebClient(env_1.env.SLACK_TOKEN)
            };
        },
        createMessageHandler: function (id, meta) {
            // Slack only allows connecting to one instance per token, unlike Discord.
            // We also generally want one store for the whole instance, so we're just
            // hardcoding this value for now. TODO, i guess
            return root_1.default(getStore('bpf'), this.name, meta.channel.is_im);
        }
    });
    //tslint:enable:no-invalid-this
    bpfBot.login();
    createDiscordBot();
}
function createDiscordBot() {
    const discordClient = new discord_js_1.Client();
    //tslint:disable:no-invalid-this
    const discordBot = new chatter_1.Bot({
        createMessageHandler: function (id, meta) {
            if (meta.message.guild) {
                return root_1.default(getStore(meta.message.guild.id), botName, meta.message.channel.type === 'dm');
            }
            return root_1.default(getStore(meta.message.channel.id), botName, meta.message.channel.type === 'dm');
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
                client: discordClient,
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
    //tslint:enable:no-invalid-this
    discordClient.on('ready', () => {
        console.log(`Connected to ${discordClient.guilds.array().map(g => g.name).join(', ')} as ${botName}`);
    });
    discordClient.on('message', discordBot.onMessage.bind(discordBot));
    discordClient.on('disconnect', (ev) => {
        console.log('disconnected! reason: ' + ev.reason);
        // setTimeout(() => discordClient.destroy().then(createDiscordBot), 10000)
    });
    discordClient.login(env_1.env.DISCORD_TOKEN);
}

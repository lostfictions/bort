"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const chatter_1 = require("chatter");
const get_store_1 = require("../store/get-store");
const root_1 = require("../commands/root");
function makeDiscordBot(botName, discordToken) {
    const client = new discord_js_1.Client();
    //tslint:disable:no-invalid-this
    const bot = new chatter_1.Bot({
        createMessageHandler: function (id, meta) {
            if (meta.message.guild) {
                return root_1.default(get_store_1.getStore(meta.message.guild.id), botName, meta.message.channel.type === 'dm');
            }
            return root_1.default(get_store_1.getStore(meta.message.channel.id), botName, meta.message.channel.type === 'dm');
        },
        getMessageHandlerArgs: function (message) {
            if (message.author.bot) {
                return false;
            }
            // Ignore non-message messages.
            if (message.type !== 'DEFAULT') {
                console.log(`Discord bot: Ignoring message type "${message.type}"`);
                return false;
            }
            const user = message.author;
            const meta = {
                bot: this,
                client,
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
    client.on('ready', () => {
        console.log(`Connected to Discord guilds ${client.guilds.array().map(g => `'${g.name}'`).join(', ')} as ${botName}`);
    });
    client.on('message', bot.onMessage.bind(bot));
    client.on('disconnect', (ev) => {
        console.log('Discord bot disconnected! reason: ' + ev.reason);
        // setTimeout(() => discordClient.destroy().then(createDiscordBot), 10000)
    });
    return {
        bot,
        client,
        login: client.login.bind(client, discordToken)
    };
}
exports.makeDiscordBot = makeDiscordBot;

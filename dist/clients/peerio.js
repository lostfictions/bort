"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chatter_1 = require("chatter");
const get_store_1 = require("../store/get-store");
const root_1 = require("../commands/root");
const icewrap_1 = require("icewrap");
function makePeerioBot(botName, peerioUsername, peerioAccountKey) {
    const client = new icewrap_1.PeerioClient(botName);
    //tslint:disable:no-invalid-this
    const bot = new chatter_1.Bot({
        createMessageHandler: function (id, data) {
            return root_1.default(get_store_1.getStore(data.chat.id), botName, !data.chat.isChannel);
        },
        getMessageHandlerArgs: function (data) {
            if (data.message.sender.username == client.user.username) {
                return false;
            }
            // Ignore system messages.
            if (data.message.systemData) {
                console.log(`Peerio bot: Ignoring system message "${data.message.systemData.action}"`);
                return false;
            }
            return {
                text: data.message.text,
                args: [data]
            };
        },
        getMessageHandlerCacheId: function (data) {
            return data.chat.id;
        },
        sendResponse: function (data, text) {
            data.chat.sendMessage(text);
        }
    });
    //tslint:enable:no-invalid-this
    client.on('message', bot.onMessage.bind(bot));
    return {
        bot,
        client,
        login: client.login.bind(client, peerioUsername, peerioAccountKey)
    };
}
exports.makePeerioBot = makePeerioBot;

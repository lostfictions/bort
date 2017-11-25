"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chatter_1 = require("chatter");
const client_1 = require("@slack/client");
const env_1 = require("../env");
const root_1 = require("../commands/root");
const get_store_1 = require("../store/get-store");
// import { hostname } from 'os'
// tslint:disable:no-invalid-this
exports.makeSlackBot = (botName, slackToken) => new chatter_1.SlackBot({
    name: botName,
    // Override the message posting options so that we simply post as our bot user
    postMessageOptions: (text) => ({
        text,
        as_user: false,
        username: botName,
        icon_url: `http://${env_1.env.HOSTNAME}/bort.png`,
        unfurl_links: true,
        unfurl_media: true
    }),
    getSlack() {
        const rtm = new client_1.RtmClient(slackToken, {
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
            webClient: new client_1.WebClient(slackToken)
        };
    },
    createMessageHandler(id, meta) {
        if (!this.slack.rtmClient.activeTeamId) {
            throw new Error(`Slack client: couldn't retrieve team id!`);
        }
        return root_1.default(get_store_1.getStore(this.slack.rtmClient.activeTeamId), this.name, meta.channel.is_im);
    }
});
// tslint:enable:no-invalid-this

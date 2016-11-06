"use strict";
const readline = require('readline');
const os_1 = require('os');
const client_1 = require('@slack/client');
const chatter_1 = require('chatter');
const store_1 = require('./store/store');
const root_1 = require('./commands/root');
const env_1 = require('./env');
const minimist = require('minimist');
const argv = minimist(process.argv.slice(2));
const pingserver_1 = require('./components/pingserver');
pingserver_1.pingserver(env_1.env.OPENSHIFT_NODEJS_PORT, env_1.env.OPENSHIFT_NODEJS_IP);
const store = store_1.makeStore();
/////////////
// Serialize on all state changes!
const path = require('path');
const fs = require('fs');
store.subscribe(() => {
    const p = path.join(env_1.env.OPENSHIFT_DATA_DIR, 'state.json');
    fs.writeFile(p, JSON.stringify(store.getState()), (e) => {
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
    const testBot = root_1.default(store, botName, false);
    rl.on('line', (input) => simulate(testBot, input));
}
else {
    //tslint:disable:no-invalid-this
    const bot = new chatter_1.SlackBot({
        name: botName,
        // Override the message posting options so that we simply post as our bot user
        postMessageOptions: (text) => ({
            text,
            as_user: false,
            username: botName,
            icon_url: 'http://' + env_1.env.OPENSHIFT_APP_DNS + '/bort.png'
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
            return root_1.default(store, this.name, meta.channel.is_im);
        }
    });
    //tslint:enable:no-invalid-this
    bot.login();
}

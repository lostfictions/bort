"use strict";
//////
//HACK: temporary
const __chatter = require('@lostfictions/chatter'); // prime cache
require.cache[require.resolve('chatter')] = require.cache[require.resolve('@lostfictions/chatter')];
require('assert').equal(require('chatter'), require('@lostfictions/chatter'));
//////
const os = require('os');
const readline = require('readline');
const fs = require('fs');
const env_1 = require('./env');
const minimist = require('minimist');
const argv = minimist(process.argv.slice(2));
const pingserver_1 = require('./components/pingserver');
pingserver_1.pingserver(env_1.env.OPENSHIFT_NODEJS_PORT, env_1.env.OPENSHIFT_NODEJS_IP);
const chatter_1 = require('chatter');
const client_1 = require('@slack/client');
const moment = require('moment');
const markov_1 = require('./components/markov');
const util_1 = require('./util/util');
const markov_2 = require('./actions/markov');
const store_1 = require('./store/store');
const store = store_1.makeStore();
const watchlist = fs.readFileSync('data/vidnite_links.txt').toString().split('\n');
const makeMessageHandler = (name) => {
    // We could get our actual bot name as below, but let's override it for testing
    // const channel = meta.channel
    // const botNames = this.getBotNameAndAliases(channel.is_im)
    const buseyCommand = chatter_1.createCommand({
        name: 'busey',
        aliases: ['acronym'],
        description: 'make buseyisms'
    }, (message) => {
        const wb = store.getState().get('wordBank');
        const letters = message.toLowerCase().split('').filter(char => /[A-Za-z]/.test(char));
        const acro = [];
        let lastWord = null;
        for (const l of letters) {
            let candidates = null;
            // First, try to find something that follows from our previous word
            if (lastWord) {
                candidates = wb.get(lastWord).keySeq().filter(word => word != null && word.startsWith(l)).toJS();
            }
            // Otherwise, just grab a random word that matches our letter
            if (candidates == null || candidates.length === 0) {
                candidates = wb.keySeq().filter(word => word != null && word.startsWith(l)).toJS();
            }
            if (candidates != null && candidates.length > 0) {
                acro.push(util_1.randomInArray(candidates));
            }
        }
        // Capitalize each word and join them into a string.
        return acro.map(word => word[0].toUpperCase() + word.slice(1)).join(' ');
    });
    const uptimeCommand = chatter_1.createCommand({
        name: 'uptime',
        description: 'info about ' + name
    }, () => {
        const hostname = os.hostname();
        const uptime = moment.duration(process.uptime(), 'seconds').humanize();
        return `hi its me <@${name}> i have been here for *${uptime}* via \`${hostname}\``;
    });
    const subCommands = [
        // conceptCommand,
        buseyCommand,
        uptimeCommand
    ];
    const helpCommand = chatter_1.createCommand({
        name: 'help',
        aliases: ['usage']
    }, () => '**Commands:**\n' + subCommands.map(c => `> *${c.name}* - ${c.description}`).join('\n'));
    const rootCommand = chatter_1.createCommand({
        isParent: true,
        name: name,
        // name: botNames.name,
        // aliases: botNames.aliases,
        description: `it ${name}`
    }, [
        ...subCommands,
        helpCommand,
        // If we match nothing, check if we can trace! if not, just return a markov sentence
            (message) => {
            const state = store.getState();
            if (message.length > 0) {
                // if(traceMatcher.test(message)) {
                //   return message.replace(traceMatcher, (_, concept) => trace(state.concepts, concept))
                // }
                const words = message.trim().split(' ').filter(w => w.length > 0);
                if (words.length > 0) {
                    const wb = state.get('wordBank');
                    const word = words[words.length - 1];
                    if (wb.has(word)) {
                        return markov_1.getSentence(wb, word);
                    }
                }
            }
            return markov_1.getSentence(state.get('wordBank'));
        }
    ]);
    // We could handle DMs differently:
    // if(channel.is_im) {
    //   return rootCommand
    // }
    // Otherwise, it's a public channel message.
    return [
        rootCommand,
            (message) => {
            if (message === '!vidrand') {
                return util_1.randomInArray(watchlist);
            }
            return false;
        },
        // If we didn't match anything, add to our markov chain.
            (message) => {
            store.dispatch(markov_2.addSentenceAction(message));
            return false;
        }
    ];
};
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
    const testBot = makeMessageHandler('bort');
    rl.on('line', (input) => simulate(testBot, input));
}
else {
    //tslint:disable:no-invalid-this
    const bot = new chatter_1.SlackBot({
        name: 'bort',
        // Override the message posting options so that we simply post as our bot user
        postMessageOptions: (text) => ({ as_user: true, text }),
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
                    .forEach(c => b.postMessage(c, `${b.name} (on \`${os.hostname()}\`)`));
            });
            return {
                rtmClient: rtm,
                webClient: new client_1.WebClient(env_1.env.SLACK_TOKEN)
            };
        },
        createMessageHandler: function (id, meta) {
            return makeMessageHandler(this.name);
        }
    });
    //tslint:enable:no-invalid-this
    bot.login();
}

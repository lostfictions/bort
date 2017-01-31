import * as readline from 'readline'
import { hostname } from 'os'

import { RtmClient, WebClient, MemoryDataStore } from '@slack/client'
import { Client as DiscordClient, Message as DiscordMessage } from 'discord.js'

import { Bot, SlackBot, processMessage, normalizeMessage } from 'chatter'

import { makeStore } from './store/store'

import makeMessageHandler from './commands/root'

import { env } from './env'
import * as minimist from 'minimist'
const argv = minimist(process.argv.slice(2))

import { pingserver } from './components/pingserver'
pingserver(env.OPENSHIFT_NODEJS_PORT, env.OPENSHIFT_NODEJS_IP)

const bpfStore = makeStore('bpf')
const slStore = makeStore('sl')

/////////////
// Serialize on all state changes!
import * as path from 'path'
import * as fs from 'fs'
bpfStore.subscribe(() => {
  const p = path.join(env.OPENSHIFT_DATA_DIR, 'bpf.json')
  fs.writeFile(p, JSON.stringify(bpfStore.getState()), (e) => {
    if(e) {
      console.error(`Couldn't write state to ${ p }: [${ e }]`)
    }
    else {
      console.log(`Wrote state to '${ p }'!`)
    }
  })
})

slStore.subscribe(() => {
  const p = path.join(env.OPENSHIFT_DATA_DIR, 'sl.json')
  fs.writeFile(p, JSON.stringify(slStore.getState()), (e) => {
    if(e) {
      console.error(`Couldn't write state to ${ p }: [${ e }]`)
    }
    else {
      console.log(`Wrote state to '${ p }'!`)
    }
  })
})
/////////////

const botName : string = argv['name'] || 'bort'

if(argv['test']) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const simulate = (messageHandler : any, message : string) => processMessage(messageHandler, message)
    .then(response => {
      const text = response !== false ? normalizeMessage(response) : '-'
      console.log(text)
    })
    // .catch(reason => console.log(`Uhhh... ${reason}`))

  const testBot = makeMessageHandler(bpfStore, botName, false)

  rl.on('line', (input : string) => simulate(testBot, input))
}
else {
  //tslint:disable:no-invalid-this
  const bpfBot = new SlackBot({
    name: botName,
    // Override the message posting options so that we simply post as our bot user
    postMessageOptions: (text : string) => ({
      text,
      as_user: false,
      username: botName,
      icon_url: 'http://' + env.OPENSHIFT_APP_DNS + '/bort.png',
      unfurl_links: true,
      unfurl_media: true
    }),
    getSlack: function(this : SlackBot) {
      const rtm = new RtmClient(env.SLACK_TOKEN, {
        dataStore: new MemoryDataStore(),
        autoReconnect: true,
        logLevel: 'error'
      })

      // Post a message to all the channels we belong to.
      const b = this
      rtm.on('open', function() : void {
        const cs = this.dataStore.channels
        Object.keys(cs)
          .filter(c => cs[c].is_member && !cs[c].is_archived)
          .forEach(c => b.postMessage(c, `${b.name} (on \`${hostname()}\`)`))
      })

      return {
        rtmClient: rtm,
        webClient: new WebClient(env.SLACK_TOKEN)
      }
    },
    createMessageHandler: function(this : SlackBot, id : any, meta : any) : any {
      return makeMessageHandler(bpfStore, this.name, meta.channel.is_im)
    }
  })
  //tslint:enable:no-invalid-this

  bpfBot.login()

  const slClient = new DiscordClient()

  //tslint:disable:no-invalid-this
  const slBot = new Bot({
    createMessageHandler: function(id : any, meta : any) : any {
      return makeMessageHandler(slStore, botName, meta.message.channel.type === 'dm')
    },
    getMessageHandlerArgs: function(this : Bot, message : DiscordMessage) : any {
      if(message.author.bot) {
        return false
      }
      // Ignore non-message messages.
      if(message.type !== 'DEFAULT') {
        console.log(`Ignoring message type "${message.type}"`)
        return false
      }

      const user = message.author
      const meta = {
        bot: this,
        client: slClient,
        message,
        user
      }
      return {
        text: message.content,
        args: [meta]
      }
    },
    getMessageHandlerCacheId : function(meta : { message : DiscordMessage }) {
      return meta.message.channel.id
    },
    sendResponse : function(message : DiscordMessage, text : string) {
      message.channel.sendMessage(text)
    }

  })
  //tslint:enable:no-invalid-this

  slClient.on('ready', () => {
    console.log(`Connected to ${slClient.guilds.array().map(g => g.name).join(', ')} as ${botName}`)
    // const cs = slClient.channels.array()
    // cs.forEach(c => c.sendMessage && c.sendMessage(`${botName} (on \`${hostname()}\`)`))
  })
  slClient.on('message', slBot.onMessage.bind(slBot))
  slClient.login(env.DISCORD_TOKEN)
}

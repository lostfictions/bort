import * as readline from 'readline'
import { hostname } from 'os'

import { RtmClient, WebClient, MemoryDataStore } from '@slack/client'
import { Client as DiscordClient, Message as DiscordMessage, User as DiscordUser } from 'discord.js'

import { Bot, SlackBot, processMessage, normalizeMessage } from 'chatter'
import { Store } from 'redux'

import { makeStore, BortStore } from './store/store'

import makeMessageHandler from './commands/root'

import { env } from './env'
import * as minimist from 'minimist'
const argv = minimist(process.argv.slice(2))

import { pingserver } from './components/pingserver'

import * as path from 'path'
import * as fs from 'fs'

pingserver(env.OPENSHIFT_NODEJS_PORT, env.OPENSHIFT_NODEJS_IP)

const stores : { [id : string] : Store<BortStore> } = {}
const getStore : (id : string) => Store<BortStore> = id => {
  if(id.length < 1) {
    throw new Error('Invalid id for store!')
  }

  if(id in stores) {
    return stores[id]
  }
  const s = makeStore(id)

  // Serialize on all state changes!
  // Probably doesn't scale, but good enough for now

  // This is also reliant on the filename logic in makeStore()
  // staying the same. TODO
  s.subscribe(() => {
    const p = path.join(env.OPENSHIFT_DATA_DIR, id + '.json')
    fs.writeFile(p, JSON.stringify(s.getState()), (e) => {
      if(e) {
        console.error(`Couldn't write state to ${ p }: [${ e }]`)
      }
      else {
        console.log(`Wrote state to '${ p }'!`)
      }
    })
  })

  stores[id] = s
  return s
}

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

  const testBot = makeMessageHandler(getStore('test'), botName, false)

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
      return makeMessageHandler(getStore('bpf'), this.name, meta.channel.is_im)
    }
  })
  //tslint:enable:no-invalid-this

  bpfBot.login()


  type DiscordMeta = {
    bot : Bot
    client : DiscordClient,
    message : DiscordMessage,
    user : DiscordUser
  }

  const discordClient = new DiscordClient()

  //tslint:disable:no-invalid-this
  const slBot = new Bot({
    createMessageHandler: function(id : any, meta : DiscordMeta) : any {
      if(meta.message.guild) {
        return makeMessageHandler(getStore(meta.message.guild.id), botName, meta.message.channel.type === 'dm')
      }
      return makeMessageHandler(getStore(meta.message.channel.id), botName, meta.message.channel.type === 'dm')
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
      const meta : DiscordMeta = {
        bot: this,
        client: discordClient,
        message,
        user
      }
      return {
        text: message.content,
        args: [meta]
      }
    },
    getMessageHandlerCacheId : function(meta : DiscordMeta) {
      return meta.message.channel.id
    },
    sendResponse : function(message : DiscordMessage, text : string) {
      message.channel.sendMessage(text)
    }

  })
  //tslint:enable:no-invalid-this

  discordClient.on('ready', () => {
    console.log(`Connected to ${discordClient.guilds.array().map(g => g.name).join(', ')} as ${botName}`)
    // const cs = slClient.channels.array()
    // cs.forEach(c => c.sendMessage && c.sendMessage(`${botName} (on \`${hostname()}\`)`))
  })
  discordClient.on('message', slBot.onMessage.bind(slBot))
  discordClient.login(env.DISCORD_TOKEN)
}

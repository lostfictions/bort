import { RtmClient } from '@slack/client'

type MessageHandler = (...args : any[]) => any | { handleMessage: (...args : any[]) => any }

type Slack = {
  rtmClient: RtmClient
  webClient: any
}

type BotOptions = {
  createMessageHandler: (...args: any[]) => any
  verbose?: boolean
  formatErrorMessage?: (message: string) => string
  log?: (...args: any[]) => void
  logError?: (...args: any[]) => void
  onMessage?: (message: any) => Promise<any>
  getMessageHandlerCacheId?: (...args: any[]) => string
  getMessageHandler?: (...args: any[]) => MessageHandler | boolean
  getMessageHandlerArgs?: (message: any) => any | boolean
  handleResponse?: (message: any, response: any) => any
  handleError?: (message: any, error: Error) => any
  sendResponse?: (message: any, ...args: any[]) => void | Promise<any>
}

type SlackBotOptions = BotOptions & {
  slack?: Slack
  getSlack?: () => Slack
  name?: string
  icon?: string
  eventNames?: string[]
  postMessageDelay?: number

  formatOnOpen?: (args: any) => string
  formatOnError?: (args: any) => string
  login?: () => any
  onOpen?: () => void
  onError?: (...args : any[]) => void
  postMessageOptions?: (...args: any[]) => any
  postMessageActual?: (channelId: any, options: any) => Promise<any>
}

declare module 'chatter' {
  export class Bot {
    constructor(options : BotOptions)
    handlerCache : { [id : string] : MessageHandler }
    processMessage(handlerOrHandlers : MessageHandler | any[], ...args : any[]) : Promise<any>
    formatErrorMessage(message : string) : string
    log(...args : any[]) : void
    logError(...args : any[]) : void
    onMessage(message : any) : Promise<any>
    getMessageHandlerCacheId(...args: any[]) : string
    getMessageHandler(...args: any[]) : MessageHandler | boolean
    getMessageHandlerArgs(message: any) : any | boolean
    handleResponse(message: any, response: any) : any
    handleError(message: any, error: Error) : any
    sendResponse(message: any, ...args: any[]) : void | Promise<any>
  }

  export class SlackBot extends Bot {
    constructor(options: SlackBotOptions)
    name: string
    icon: string
    slack: Slack
    getSlack?: () => Slack
    eventNames: string[]
    postMessageDelay: number
    parseMessage(message: string) : string
    formatOnOpen(args: any) : string
    formatOnError(args: any) : string
    login() : SlackBot
    bindEventHandlers(events: string[]) : void
    onOpen() : void
    onError(...args : any[]) : void
    postMessage(channelId: string, optionsOrMessage: any ) : Promise<any>
    postMessageOptions(...args: any[]) : any
    postMessageActual(channelId: any, options: any) : Promise<any>
    getBotNameAndAliases(isIm?: boolean) : { name: string, aliases: string[] }
  }

  export const createBot : (options: BotOptions) => Bot
  export const createSlackBot : (options: BotOptions) => SlackBot

  // Message handlers
  export const DelegatingMessageHandler : any
  export const createDelegate : any
  export const MatchingMessageHandler : any
  export const createMatcher : any
  export const ArgsAdjustingMessageHandler : any
  export const createArgsAdjuster : any
  export const ParsingMessageHandler : any
  export const createParser : any
  export const ConversingMessageHandler : any
  export const createConversation : any
  export const CommandMessageHandler : any
  export const createCommand : any

  // Util
  export const processMessage : (handlerOrHandlers : MessageHandler | any[], ...args : any[]) => Promise<any>
  export const isMessageHandlerOrHandlers : (val : any) => boolean

  export const parseArgs : (args: string, validProps: any) => { options: any, args: string[], errors: string[] }

  export const isMessage : (args: any) => boolean
  export const isArrayOfMessages : (args: any) => boolean
  export const normalizeMessage : (args: any) => string
  export const normalizeMessages : (args: any[]) => string[]
  export const normalizeResponse : (response : any) => string[]

  export class Queue {
    constructor(options: { onDrain?: (data: any) => void })
    enqueue(id: any, data: any) : Promise<any>
    drain(id: any) : Promise<any>
  }
}

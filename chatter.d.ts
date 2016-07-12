declare module 'chatter' {
  export const Bot
  export const createBot
  export const SlackBot
  export const createSlackBot

  // Message handlers
  export const DelegatingMessageHandler
  export const createDelegate
  export const MatchingMessageHandler
  export const createMatcher
  export const ArgsAdjustingMessageHandler
  export const createArgsAdjuster
  export const ParsingMessageHandler
  export const createParser
  export const ConversingMessageHandler
  export const createConversation
  export const CommandMessageHandler
  export const createCommand

  // Util
  export const processMessage
  export const isMessageHandlerOrHandlers

  export const parseArgs

  export const isMessage
  export const isArrayOfMessages
  export const normalizeMessage
  export const normalizeMessages
  export const normalizeResponse

  export const Queue
  export const composeCreators
}
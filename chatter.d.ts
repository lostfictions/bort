declare module 'chatter' {
  export const Bot : any
  export const createBot : any
  export const SlackBot : any
  export const createSlackBot : any

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
  export const processMessage : any
  export const isMessageHandlerOrHandlers : any

  export const parseArgs : any

  export const isMessage : any
  export const isArrayOfMessages : any
  export const normalizeMessage : any
  export const normalizeMessages : any
  export const normalizeResponse : any

  export const Queue : any
  export const composeCreators : any
}

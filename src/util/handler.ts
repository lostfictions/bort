export type HandlerResult<T> = T | false | Promise<T | false>
type HandlerFn<TData, TResult> = (data : TData) => HandlerResult<TResult>
export type Handler<TData, TResult> =
  HandlerFn<TData, TResult> |
  { handleMessage : HandlerFn<TData, TResult> }

export type HandlerOrHandlers<TData, TResult> =
  Handler<TData, TResult> |
  Handler<TData, TResult>[]

// tslint:disable-next-line: interface-over-type-literal
type DefaultData = { message : string }

export async function processMessage<
    TData = DefaultData, TResult = string
  >(handlerOrHandlers : HandlerOrHandlers<TData, TResult>, data : TData) : Promise<TResult | false> {

  if(!Array.isArray(handlerOrHandlers)) {
    if(typeof handlerOrHandlers === 'function') {
      return handlerOrHandlers(data)
    }
    else {
      return handlerOrHandlers.handleMessage(data)
    }
  }

  for(const handler of handlerOrHandlers) {
    const res = await processMessage(handler, data)

    if(res !== false) {
      return res
    }
  }
  return false
}

interface CommandOptions {
  name : string
  aliases? : string[]
  usage? : string
  description? : string
  details? : string
}

export function makeCommand<
    TData extends { message : string }, TReturn = string
  >(
    options : CommandOptions, handlerOrHandlers : HandlerOrHandlers<TData, TReturn>
  ) : (data : TData) => Promise<TReturn | false> {

  const aliases = [options.name, ...options.aliases || []]

  // TODO: add metadata fields
  return async (data : TData) => {
    const matchingAlias = aliases.find(alias => data.message.startsWith(alias + ' '))
    if(matchingAlias != null) {
      const commandData : TData = { ...data as any, message: data.message.substr(matchingAlias.length + 1) }
      return processMessage(handlerOrHandlers, commandData)
    }
    return false
  }
}

export function adjustArgs<
    TAdjusted = { message : string }, TData = TAdjusted, TReturn = string
  >(
    adjuster : (data : TData) => TAdjusted | false,
    handlerOrHandlers : HandlerOrHandlers<TAdjusted, TReturn>
  ) : (data : TData) => Promise<TReturn | false> {

  return async (data : TData) => {
    const adjustedData = adjuster(data)
    if(adjustedData === false) {
      return false
    }

    return processMessage(handlerOrHandlers, adjustedData)
  }
}

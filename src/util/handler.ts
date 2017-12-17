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

export function makeCommand<
    TData extends { message : string }, TReturn = string
  >(
    command : string, handlerOrHandlers : HandlerOrHandlers<TData, TReturn>
  ) : (data : TData) => Promise<TReturn | false> {

  return async (data : TData) => {
    if(data.message.startsWith(command + ' ')) {
      const commandData : TData = { ...data as any, message: data.message.substr(command.length + 1) }
      return processMessage(handlerOrHandlers, commandData)
    }
    return false
  }
}

export function adjustArgs<
    TAdjusted, TData = { message : string }, TReturn = string
  >(
    adjuster : (data : TData) => TAdjusted,
    handlerOrHandlers : HandlerOrHandlers<TAdjusted, TReturn>
  ) : (data : TData) => Promise<TReturn | false> {

  return async (data : TData) => processMessage(handlerOrHandlers, adjuster(data))
}

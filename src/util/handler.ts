import { escapeForRegex } from "./index";

type HandlerResult<T> = T | false | Promise<T | false>;
type HandlerFn<TData, TResult> = (data: TData) => HandlerResult<TResult>;
export type Handler<TData, TResult = string> =
  | HandlerFn<TData, TResult>
  | { handleMessage: HandlerFn<TData, TResult> };

export type HandlerOrHandlers<TData> = Handler<TData> | Handler<TData>[];

// tslint:disable-next-line: interface-over-type-literal
type DefaultData = { message: string };

export async function processMessage<TData = DefaultData>(
  handlerOrHandlers: HandlerOrHandlers<TData>,
  data: TData
): Promise<string | false> {
  if (!Array.isArray(handlerOrHandlers)) {
    if (typeof handlerOrHandlers === "function") {
      return handlerOrHandlers(data);
    } else {
      return handlerOrHandlers.handleMessage(data);
    }
  }

  for (const handler of handlerOrHandlers) {
    const res = await processMessage(handler, data);

    if (res !== false) {
      return res;
    }
  }
  return false;
}

interface CommandOptions {
  name: string;
  aliases?: string[];
  usage?: string;
  description?: string;
  details?: string;
}

export interface Command<TData> {
  handleMessage: HandlerFn<TData, string>;
  readonly name: string;
  readonly aliases?: string[];
  readonly usage?: string;
  readonly description?: string;
  readonly details?: string;
}

export function makeCommand<TData extends { message: string }>(
  options: CommandOptions,
  handlerOrHandlers: HandlerOrHandlers<TData>
): Command<TData> {
  const escapedAliases = [options.name, ...(options.aliases || [])]
    .map(escapeForRegex)
    .join("|");

  const aliasRegex = new RegExp(
    `^(?:${escapedAliases})(?:\\s+|$)([\\s\\S]*)`,
    "i"
  );

  const handleMessage = async (data: TData) => {
    const matchResult = data.message.match(aliasRegex);
    if (matchResult) {
      const message = matchResult[1];
      const commandData: TData = { ...(data as any), message };
      return processMessage(handlerOrHandlers, commandData);
    }
    return false;
  };

  const command = {
    handleMessage,
    name: options.name
  };

  ["usage", "description", "details", "aliases"].forEach(prop => {
    if (prop in options) {
      (command as any)[prop] = (options as any)[prop];
    }
  });

  return command;
}

export function adjustArgs<TAdjusted = { message: string }, TData = TAdjusted>(
  adjuster: (data: TData) => TAdjusted | false,
  handlerOrHandlers: HandlerOrHandlers<TAdjusted>
): (data: TData) => Promise<string | false> {
  return async (data: TData) => {
    const adjustedData = adjuster(data);
    if (adjustedData === false) {
      return false;
    }

    return processMessage(handlerOrHandlers, adjustedData);
  };
}

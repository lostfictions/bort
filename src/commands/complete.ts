import { makeCommand } from '../util/handler'
import * as got from 'got'

import { HandlerArgs } from '../handler-args'

import { tryTrace } from '../components/trace'


export default makeCommand<HandlerArgs>(
  {
    name: 'complete',
    aliases: ['tell me'],
    description: "we know each other so well we finish each other's sentences"
  },
  async ({ message, store }) => {
    if(message.length === 0) {
      return false
    }

    const maybeTraced = tryTrace(message, store.getState().get('concepts'))

    const res = await got(`https://suggestqueries.google.com/complete/search`, {
      query: { q: maybeTraced || message, client: 'firefox' },
      timeout: 5000
    })

    let prefix = ''
    if(maybeTraced) {
      prefix = `(${maybeTraced})\n`
    }

    if(res.body.length > 0) {
      const parsed = JSON.parse(res.body)
      if(parsed[1] && parsed[1].length && parsed[1].length > 0) {
        return prefix + parsed[1].join('\n')
      }
    }

    return prefix + '¯\\_(ツ)_/¯'
  }
)

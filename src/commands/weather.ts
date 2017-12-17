import { HandlerArgs } from './HandlerArgs'
import { makeCommand } from '../util/handler'
import * as got from 'got'

export default makeCommand<HandlerArgs>(
  {
    name: 'weather',
    description: 'rain or shine'
  },
  async ({ message }) => {
    if(message.length === 0) {
      return false
    }

    const res = await got(`http://wttr.in/${message}?q0T`, {
      timeout: 5000,
      headers: {
        'User-Agent': 'curl'
      }
    })

    return '```' + res.body + '```'
  }
)

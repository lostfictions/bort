import { createCommand } from 'chatter'
import * as got from 'got'

import { AdjustedArgs } from './AdjustedArgs'

export default createCommand(
  {
    name: 'weather',
    description: 'rain or shine'
  },
  (message : string, { store } : AdjustedArgs) : Promise<string> | false => {
    if(message.length === 0) {
      return false
    }

    return got(`http://wttr.in/${message}?q0T`, {
      timeout: 5000,
      headers: {
        'User-Agent': 'curl'
      }
    })
      .then(res => '```' + res.body + '```')
  }
)

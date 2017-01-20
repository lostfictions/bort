import { createCommand } from 'chatter'
import * as got from 'got'

import { randomInArray } from '../util/util'

export default createCommand(
  {
    name: 'complete',
    aliases: ['tell me'],
    description: "we know each other so well we finish each other's sentences"
  },
  (message : string) : Promise<string> | false => {
    if(message.length === 0) {
      return false
    }

    return got(`https://suggestqueries.google.com/complete/search`, {
      query: { q: message, client: 'firefox' },
      timeout: 5000
    })
    .then(res => JSON.parse(res.body)[1].join('\n'))
    .catch(reason => console.log(`can't return completion: '${reason}'`))
  }
)

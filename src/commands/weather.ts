import { createCommand } from 'chatter'
import * as got from 'got'

export default createCommand(
  {
    name: 'weather',
    description: 'rain or shine'
  },
  (message : string) : Promise<string> | false => {
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

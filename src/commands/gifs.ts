import { createCommand } from 'chatter'
import * as got from 'got'

import { randomInArray } from '../util/util'

interface GifResult {
  page : string
  url_text : string
  checksum : string
  weight : number
  width : number
  gif : string
  height : number
}

export default createCommand(
  {
    name: 'gifsearch',
    aliases: ['gif me the', 'gif me a', 'gif me', 'gif'],
    description: 'geocities classix'
  },
  (message : string) : Promise<string> | false => {
    if(message.length === 0) {
      return false
    }

    return got(`https://gifcities.archive.org/api/v1/gifsearch`, {
      query: { q: message, limit: 5 },
      timeout: 5000
    })
    .then(res => randomInArray<string>(
      JSON.parse(res.body).map((g : GifResult) => 'https://web.archive.org/web/' + g.gif))
    )}
)

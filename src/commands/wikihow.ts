import { createCommand } from 'chatter'
import * as got from 'got'
import * as cheerio from 'cheerio'

import { randomInArray } from '../util'

import { AdjustedArgs } from './AdjustedArgs'
import { tryTrace } from '../components/trace'

function getRandomImage(body : string) : string {
  const imgs = cheerio.load(body)('img.whcdn').toArray()
    .map(img => img.attribs['data-src'])
    .filter(url => url) // only images with this attribute!
  return randomInArray(imgs)
}

async function search(term : string) : Promise<string> {
  try {
    const res = await got('https://www.wikihow.com/wikiHowTo', { query: { search: term } })
    let topResult = cheerio
      .load(res.body)('a.result_link').toArray()
      .map(a => a.attribs.href)
      .find(url => !url.includes('Category:')) // first link that isn't a category

    if(topResult) {
      if(topResult.startsWith('//')) { // got can't handle uris without protocols.
        topResult = 'https:' + topResult
      }
      const wikiRes = await got(topResult)
      return getRandomImage(wikiRes.body)
    }
  }
  catch(e) { /* Don't care how we failed */ }
  return 'dunno how :('
}

export default createCommand(
  {
    name: 'wikihow',
    aliases: [`how do i`, `how to`],
    description: 'learn anything'
  },
  (message : string, { store } : AdjustedArgs) : Promise<string> => {
    if(message.length === 0) {
      return got('https://www.wikihow.com/Special:Randomizer')
        .then(res => getRandomImage(res.body))
    }

    const maybeTraced = tryTrace(message, store.getState().get('concepts'))
    if(maybeTraced) {
      return search(maybeTraced)
        .then(res => `(${maybeTraced})\n${res}`)
    }

    return search(message)
  }
)

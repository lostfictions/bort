import { createCommand } from 'chatter'
import * as got from 'got'
import * as cheerio from 'cheerio'

import { randomInArray } from '../util/util'

// based on https://github.com/jimkang/g-i-s/blob/master/index.js

const makeSearch = (animated : boolean) => (term : string) => got('http://images.google.com/search', {
  query: {
    q: term,
    tbm: 'isch', // perform an image search
    nfpr: 1, //exact search, don't correct typos
    tbs: animated ? 'itp:animated' : undefined
  },
  timeout: 5000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.86 Safari/537.36'
  }
})
.then(res => {
  const $ = cheerio.load(res.body)
  const metaLinks = $('.rg_meta')
  const urls : string[] = []
  metaLinks.each((i, el) => {
    if(el.children.length > 0 && 'data' in el.children[0]) {
      const metadata = JSON.parse((el.children[0] as any).data)
      if(metadata.ou) {
        urls.push(metadata.ou)
      }
      // Elements without metadata.ou are subcategory headings in the results page.
    }
  })
  return randomInArray(urls.slice(0, 5))
})

const imageSearch = makeSearch(false)
export const imageSearchCommand = createCommand(
  {
    name: 'image',
    aliases: [`what's a`, `what's`, `who's`, 'show me'],
    description: 'i will show you'
  },
  (message : string) : Promise<string> | false => {
    if(message.length === 0) {
      return false
    }
    return imageSearch(message)
  }
)


const gifSearch = makeSearch(true)
export const gifSearchCommand = createCommand(
  {
    name: 'gifsearch',
    aliases: ['gif me the', 'gif me a', 'gif me', 'gif'],
    description: 'moving pictures'
  },
  (message : string) : Promise<string> | false => {
    if(message.length === 0) {
      return false
    }
    return gifSearch(message)
  }
)

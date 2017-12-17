import { makeCommand } from '../util/handler'
import * as got from 'got'
import * as cheerio from 'cheerio'

import { Store } from 'redux'
import { BortStore } from '../store/store'
import {
  addRecentAction
} from '../actions/recents'

import { randomInArray } from '../util'

import { HandlerArgs } from './HandlerArgs'
import { tryTrace } from '../components/trace'

// based on https://github.com/jimkang/g-i-s/blob/master/index.js

const requestAndParse = (term : string, animated : boolean, exact : boolean) => got('http://images.google.com/search', {
  query: {
    q: term,
    tbm: 'isch', // perform an image search
    nfpr: exact ? 1 : 0, // exact search, don't correct typos
    tbs: animated ? 'itp:animated' : undefined
  },
  timeout: 5000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.86 Safari/537.36'
  }
}).then(res => {
  const $ = cheerio.load(res.body)
  const metaLinks = $('.rg_meta')
  const urls : string[] = []
  metaLinks.each((_i, el) => {
    if(el.children.length > 0 && 'data' in el.children[0]) {
      const metadata = JSON.parse((el.children[0] as any).data)
      if(metadata.ou) {
        urls.push(metadata.ou)
      }
      // Elements without metadata.ou are subcategory headings in the results page.
    }
  })
  return urls
})

const search = (term : string, store : Store<BortStore>, animated = false) =>
  requestAndParse(term, animated, true)
    .then(res => {
      if(res.length === 0) {
        // if no results, try an inexact search
        return requestAndParse(term, animated, false)
      }
      return res
    })
    .then(res => {
      const state = store.getState()
      const excluding = state.get('recents')

      const unseenResults = []
      while(res.length > 0 && unseenResults.length < 5) {
        const i = res.shift()!
        if(!excluding.has(i)) {
          unseenResults.push(i)
        }
      }

      if(unseenResults.length === 0) {
        return 'nothing :('
      }

      const result = randomInArray(unseenResults)
      store.dispatch(addRecentAction(result))
      return result
    })

export const imageSearchCommand = makeCommand<HandlerArgs>(
  {
    name: 'image',
    aliases: [`what's`, `who's`, `what is`, `who is`, `show me the`, `show me an`, `show me a`, `show me`],
    description: 'i will show you'
  },
  ({ message, store }) : Promise<string> | false => {
    if(message.length === 0) {
      return false
    }

    const maybeTraced = tryTrace(message, store.getState().get('concepts'))
    if(maybeTraced) {
      return search(maybeTraced, store)
        .then(res => `(${maybeTraced})\n${res}`)
    }

    return search(message, store)
  }
)

export const gifSearchCommand = makeCommand<HandlerArgs>(
  {
    name: 'gifsearch',
    aliases: ['gif me the', 'gif me an', 'gif me a', 'gif me', 'gif'],
    description: 'moving pictures'
  },
  ({ message, store }) : Promise<string> | false => {
    if(message.length === 0) {
      return false
    }

    const maybeTraced = tryTrace(message, store.getState().get('concepts'))
    if(maybeTraced) {
      return search(maybeTraced, store, true).then(res => `(${maybeTraced})\n${res}`)
    }

    return search(message, store, true)
  }
)

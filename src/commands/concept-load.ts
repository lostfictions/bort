import { createCommand } from 'chatter'
import * as got from 'got'
import { isURL } from 'validator'
import { AdjustedArgs } from './AdjustedArgs'
import {
  loadConceptAction
} from '../actions/concept'

const loaderRegex = /^([^ ]+) +(?:path[=: ]([\w\d.]+) +)?(?:as|to) +([^\s]+)$/

const slackEscapeRegex = /^<(.+)>$/

const traverse = (obj : any, path : string[]) : any => {
  try {
    path.forEach(p => obj = obj[p])
    return obj
  }
  catch(e) {}
  return null
}

export default createCommand(
  {
    name: 'load',
    aliases: ['json'],
    description: 'load a concept list from a url, overwriting existing concept if it exists'
  },
  (message : string, { store } : AdjustedArgs) : Promise<string> | string | false => {
    if(message.length === 0) {
      return false
    }

    const matches = loaderRegex.exec(message)
    if(!matches) {
      return `*load* usage: [url] (path=path) as [concept]`
    }

    const [, rawUrl, rawPath, concept] = matches

    const path = rawPath.split('.')

    let url = rawUrl
    const slackFixedUrl = slackEscapeRegex.exec(rawUrl)
    if(slackFixedUrl) {
      url = slackFixedUrl[1]
    }

    if(!isURL(url)) {
      return `Error: '${url}' doesn't appear to be a valid URL.
      *load* usage: [url] (path=path) as [concept]`
    }

    return (got(url, { json: true }) as Promise<{ body : any }>)
      .then(({ body: json }) => {
        if(path) {
          const itemOrItems = traverse(json, path)
          if(!itemOrItems) {
            const validKeys = Object.keys(json).slice(0, 5).map(k => `'${k}'`).join(', ')
            throw new Error(`Invalid path: '${rawPath}'. Some valid keys: ${validKeys}...`)
          }
          if(Array.isArray(itemOrItems)) {
            return itemOrItems.map(i => i.toString())
          }

          const res = itemOrItems.toString()
          if(res === '[object Object]') {
            throw new Error(`Requested item does not appear to be a primitive or array! Aborting.`)
          }
          return [res]
        }
        if(Array.isArray(json)) {
          return json.map(i => i.toString())
        }

        const res = json.toString()
        if(res === '[object Object]') {
          throw new Error(`Requested item does not appear to be a primitive or array! Aborting.`)
        }
        return [res]
      })
      .then(items => {
        store.dispatch(loadConceptAction(concept, items))
        return items.length
      })
      .then(length => `Loaded ${length} items from ${url}.`)
      .catch(e => e)
  }
)

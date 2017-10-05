import * as path from 'path'
import * as fs from 'fs'

import { Store } from 'redux'
import { makeStore, BortStore } from './store'
import { env } from '../env'

import { cleanRecentsAction } from '../actions/recents'

const storeCache : { [id : string] : Store<BortStore> } = {}

export const getStore : (id : string) => Store<BortStore> = id => {
  if(id.length < 1) {
    throw new Error('Invalid id for store!')
  }

  if(id in storeCache) {
    return storeCache[id]
  }
  const s = makeStore(id)

  // Serialize on all state changes!
  // Probably doesn't scale, but good enough for now

  // This is also reliant on the filename logic in makeStore()
  // staying the same. TODO
  s.subscribe(() => {
    const p = path.join(env.DATA_DIR, id + '.json')
    fs.writeFile(p, JSON.stringify(s.getState()), (e) => {
      if(e) {
        console.error(`Couldn't write state to ${ p }: [${ e }]`)
      }
      else {
        // console.log(`Wrote state to '${ p }'!`)
      }
    })
  })

  setInterval(() => s.dispatch(cleanRecentsAction()), 60000)

  storeCache[id] = s
  return s
}

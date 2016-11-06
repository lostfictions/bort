import * as fs from 'fs'
import * as path from 'path'
import { createStore, Store, Reducer, StoreEnhancer } from 'redux'
import { combineReducers } from 'redux-immutable'
import { fromJS, Map } from 'immutable'
import { env } from '../env'

import { WordBank } from '../components/markov'
import { markovReducers } from '../reducers/markov'
import { addSentenceAction } from '../actions/markov'

// import { ConceptBank } from '../commands/concepts'

export interface BortStore extends Map<string, any> {
  get(key : 'wordBank') : WordBank
  // get(key : 'concepts') : ConceptBank
}

const rootReducer = combineReducers({
  wordBank: markovReducers
})

export function makeStore() : Store<BortStore> {
  let initialState : BortStore
  try {
    const p = path.join(env.OPENSHIFT_DATA_DIR, 'state.json')
    const d = fs.readFileSync(p).toString()
    const json = JSON.parse(d)
    initialState = fromJS(json)
    //TODO: check fields/shape
    console.log(`Restored state from '${p}'!`)
  }
  catch(e) {
    console.error(`Can't deserialize state! [Error: ${e}]\nRestoring from defaults instead.`)
    initialState = Map<string, any>({
      wordBank : getInitialWordbank(),
      // concepts : getInitialConcepts()
    })
  }

  return createStore<BortStore>(rootReducer, initialState)
}

function getInitialWordbank() : WordBank {
  const tarotLines : string[] = require('../data/corpora').tarotLines

  return tarotLines.reduce<WordBank>(
    (p, line) => markovReducers(p, addSentenceAction(line)),
    Map<string, Map<string, number>>()
  )
}

// function getInitialConcepts() : ConceptBank {
//   const cb : ConceptBank = {}

// const watchlist = fs.readFileSync('data/letterboxd_watchlist_scraped.txt').toString().split('\n')

//   const corpora = require('../../data/corpora')
//   cb['punc'] = corpora.punc
//   cb['interjection'] = corpora.interjection
//   cb['adj'] = corpora.adj
//   cb['noun'] = corpora.noun

//   cb['vidnite'] = require('../../data/watched.json').singular

//   return cb
// }

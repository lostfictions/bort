import * as fs from 'fs'
import * as path from 'path'
import { createStore, Store, Reducer, StoreEnhancer } from 'redux'
import { combineReducers } from 'redux-immutable'
import { fromJS, Map } from 'immutable'
import { env } from '../env'

import { markovReducers } from '../reducers/markov'
import { conceptReducers } from '../reducers/concepts'

import { WordBank } from '../components/markov'
import { ConceptBank } from '../commands/concepts'

import { addSentenceAction } from '../actions/markov'

import * as assert from 'assert'

export interface BortStore extends Map<string, any> {
  get(key : 'wordBank') : WordBank
  get(key : 'concepts') : ConceptBank
}

const rootReducer = combineReducers({
  wordBank: markovReducers,
  concepts: conceptReducers
})

export function makeStore() : Store<BortStore> {
  let initialState : BortStore
  try {
    const p = path.join(env.OPENSHIFT_DATA_DIR, 'state.json')
    const d = fs.readFileSync(p).toString()
    const json = JSON.parse(d)

    // Basic sanity check on shape returned
    const props : { [ propName : string ] : (propValue : any) => any } = {
      'wordBank': (p : any) => p,
      'concepts': (p : any) => p
    }
    // tslint:disable-next-line:forin
    for(const k in props) {
      assert(props[k](json[k]), `Property ${ k } not found in '${ p }'!`)
    }

    initialState = fromJS(json)
    console.log(`Restored state from '${p}'!`)
  }
  catch(e) {
    console.error(`Can't deserialize state! [Error: ${e}]\nRestoring from defaults instead.`)
    initialState = Map<string, any>({
      wordBank : getInitialWordbank(),
      concepts : getInitialConcepts()
    })
  }

  return createStore<BortStore>(rootReducer, initialState)
}

function getInitialWordbank() : WordBank {
  const tarotLines : string[] = require('../../data/corpora').tarotLines

  return tarotLines.reduce<WordBank>(
    (p, line) => markovReducers(p, addSentenceAction(line)),
    Map<string, Map<string, number>>()
  )
}

function getInitialConcepts() : ConceptBank {
  const cb : any = {}

  const corpora = require('../../data/corpora')
  cb['punc'] = corpora.punc
  cb['interjection'] = corpora.interjection
  cb['adj'] = corpora.adj
  cb['noun'] = corpora.noun
  cb['digit'] = corpora.digit
  cb['consonant'] = corpora.consonant
  cb['vowel'] = corpora.vowel

  assert(Array.isArray(cb['punc']))
  assert(Array.isArray(cb['interjection']))
  assert(Array.isArray(cb['adj']))
  assert(Array.isArray(cb['noun']))
  assert(Array.isArray(cb['digit']))
  assert(Array.isArray(cb['consonant']))
  assert(Array.isArray(cb['vowel']))

  cb['vidnite'] = require('../../data/watched.json').singular
  assert(Array.isArray(cb['vidnite']))

  cb['!vidrand'] = fs.readFileSync('data/letterboxd_watchlist_scraped.txt').toString().split('\n')

  return fromJS(cb) as ConceptBank
}
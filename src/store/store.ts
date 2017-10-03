import * as fs from 'fs'
import * as path from 'path'
import { createStore, Store, Reducer, StoreEnhancer } from 'redux'
import { combineReducers } from 'redux-immutable'
import { fromJS, Map } from 'immutable'
import { env } from '../env'

import { markovReducers } from '../reducers/markov'
import { conceptReducers } from '../reducers/concepts'
import { recentsReducers } from '../reducers/recents'

import { WordBank } from '../components/markov'
import { ConceptBank } from '../commands/concepts'

import { addSentenceAction } from '../actions/markov'

import * as assert from 'assert'

export interface BortStore extends Map<string, any> {
  get(key : 'wordBank') : WordBank
  get(key : 'concepts') : ConceptBank
  // a cache of recent responses to avoid repetition.
  // maps from response -> time sent (in ms from epoch)
  get(key : 'recents') : Map<string, number>
}

const rootReducer = combineReducers<BortStore>({
  wordBank: markovReducers,
  concepts: conceptReducers,
  recents: recentsReducers
})

export function makeStore(filename : string = 'state') : Store<BortStore> {
  let initialState : BortStore
  try {
    const p = path.join(env.DATA_DIR, filename + '.json')
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

    // short of having a way to migrate a schema, just add this in if it's not present
    // when we load.
    if(!json.recents) {
      json.recents = {}
    }

    initialState = fromJS(json)
    console.log(`Restored state from '${p}'!`)
  }
  catch(e) {
    console.error(`Can't deserialize state! [Error: ${e}]\nRestoring from defaults instead.`)
    initialState = Map<string, any>({
      wordBank: getInitialWordbank(),
      concepts: getInitialConcepts(),
      recents: Map<string, number>()
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
  cb['verb'] = corpora.verb.map((v : { present : string, past : string}) => v.present)

  assert(Array.isArray(cb['punc']))
  assert(Array.isArray(cb['interjection']))
  assert(Array.isArray(cb['adj']))
  assert(Array.isArray(cb['noun']))
  assert(Array.isArray(cb['digit']))
  assert(Array.isArray(cb['consonant']))
  assert(Array.isArray(cb['vowel']))
  assert(Array.isArray(cb['verb']))

  // cb['vidnite'] = require('../../data/watched.json').singular
  // assert(Array.isArray(cb['vidnite']))

  // cb['!vidrand'] = fs.readFileSync('data/letterboxd_watchlist_scraped.txt').toString().split('\n')

  return fromJS(cb) as ConceptBank
}

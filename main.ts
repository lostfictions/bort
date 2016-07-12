import * as envalid from 'envalid'
const env = envalid.cleanEnv(process.env, {
  SLACK_TOKEN: envalid.str(),
  GOOGLE_PRIVATE_KEY: envalid.str(),
  GOOGLE_CLIENT_EMAIL: envalid.email(),
  GOOGLE_SHEET_ID: envalid.str(),
  OPENSHIFT_NODEJS_PORT: envalid.num({ default: 8080 }),
  OPENSHIFT_NODEJS_IP: envalid.str({ default: 'localhost' }),
  NGRAM_LENGTH: envalid.num({ default: 2 })
})

// import * as fs from 'fs'
// import * as os from 'os'

// import * as moment from 'moment'
// import * as _ from 'lodash'
// import * as async from 'async'

import * as chatter from 'chatter'

// const GoogleSpreadsheet = require('google-spreadsheet')
// const syllable = require('syllable')
// const pronouncing = require('pronouncing')

//Open a responder we can ping (via uptimerobot.com or similar) so the OpenShift app doesn't idle
// const app = require('express')()
// app.get('/', (req, res) => {
  // res.status(200).end()
// })
// app.listen(env.OPENSHIFT_NODEJS_PORT, env.OPENSHIFT_NODEJS_IP)

// function randomInArray<T>(arr : Array<T>) : T { return arr[Math.floor(Math.random() * arr.length)] }

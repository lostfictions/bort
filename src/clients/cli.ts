import * as readline from 'readline'
import { processMessage, normalizeMessage } from 'chatter'

import { getStore } from '../store/get-store'
import makeMessageHandler from '../commands/root'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const simulate = (messageHandler : any, message : string) => processMessage(messageHandler, message)
  .then(response => {
    const text = response !== false ? normalizeMessage(response) : '-'
    console.log(text)
  })

export const makeCLIBot = (botName : string ) => {
  const testBot = makeMessageHandler(getStore('test'), botName, false)
  rl.on('line', (input : string) => simulate(testBot, input))
  return testBot
}

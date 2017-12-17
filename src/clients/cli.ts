import * as readline from 'readline'
import { processMessage } from '../util/handler'

import { getStore } from '../store/get-store'
import makeMessageHandler from '../commands/root'


const simulate = (messageHandler : any, message : string) => processMessage(messageHandler, message)
  .then(response => {
    if(response !== false) {
      console.log(response)
    }
  })

export const makeCLIBot = (botName : string) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const testBot = makeMessageHandler(getStore('test'), botName, false)
  rl.on('line', (input : string) => simulate(testBot, input))
  return testBot
}

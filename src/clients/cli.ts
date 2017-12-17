import * as readline from 'readline'
import { processMessage } from '../util/handler'

import { getStore } from '../store/get-store'
import messageHandler from '../commands/root'

export const makeCLIBot = () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  rl.on('line', (message : string) => processMessage(messageHandler, {
    message,
    store: getStore('test'),
    isDM: false,
    channel: 'cli'
  }).then(response => {
    if(response !== false) {
      console.log(response)
    }
  }))

  return rl
}

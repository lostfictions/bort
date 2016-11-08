import { createCommand } from 'chatter'
import * as imageSearch from 'g-i-s'

type imageSearchResult = {
  url : string
  width : number
  height : number
}

export default createCommand(
  {
    name: 'image',
    aliases: [`what's a`, `what's`, `who's`],
    description: 'i will show you'
  },
  (message : string) => new Promise((resolve, reject) => {
    imageSearch(
      {
        searchTerm: message,
        queryStringAddition: '&nfpr=1' //exact search, don't correct typos
      },
      (error : string, results : imageSearchResult[]) => {
        if(error != null) {
          return reject(error)
        }
        if(results.length === 0 || results[0].url.length === 0) {
          return reject('Invalid search result!')
        }
        resolve(results[0].url)
      }
    )
  })
)

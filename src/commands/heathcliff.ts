import { createCommand } from 'chatter'
import * as fs from 'fs'
import * as path from 'path'
import * as Jimp from 'jimp'

import { randomInArray } from '../util/util'
import { env } from '../env'

const imgDir = path.join(__dirname, '../../data/heathcliff')

const filenames = fs.readdirSync(imgDir)

async function load(files : string[]) : Promise<[Jimp, string[]]> {
  const nextFiles = files.slice()

  let img : Jimp
  do {
    const fn = randomInArray(nextFiles)
    nextFiles.splice(nextFiles.indexOf(fn), 1)
    img = await Jimp.read(path.join(imgDir, fn))
  } while(img.bitmap.width > img.bitmap.height) //NO SUNDAYS

  return [img, nextFiles]
}

export default createCommand(
  {
    name: 'heathcliff',
    aliases: [`cliff me`, `bortcliff`, `borthcliff`],
    description: 'cliff composition'
  },
  () : Promise<string> => new Promise<string>((resolve, reject) => {
    load(filenames)
      .then(([i, nextFiles]) => {
        load(nextFiles).then(([j]) => {
          const [small, big] = i.bitmap.width < j.bitmap.width ? [i, j] : [j, i]
          big.resize(small.bitmap.width, Jimp.AUTO)

          i.blit(j, 0, i.bitmap.height * 0.9, 0, j.bitmap.height * 0.9, j.bitmap.width, j.bitmap.height * 0.1)

          i.write(
            path.join(__dirname, '../../static/composite.jpg'),
            (e : any) => {
              if(e) {
                reject(e)
              }
              else {
                resolve('http://' + env.OPENSHIFT_APP_DNS + '/composite.jpg')
              }
            })
        })
      })
  })
)


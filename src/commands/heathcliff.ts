import { createCommand } from 'chatter'
import * as fs from 'fs'
import * as path from 'path'
import * as Jimp from 'jimp'

import { AdjustedArgs } from './AdjustedArgs'
import { randomInArray, randomInRange } from '../util/util'
import { env } from '../env'

const outputDirname = 'cliffs'
const outDir = path.join(__dirname, '../../static/', outputDirname)
if(!fs.existsSync(outDir)) {
  console.log(outDir + ' not found! creating.')
  fs.mkdirSync(outDir)
}

const imgDir = path.join(env.DATA_DIR, 'heathcliff')

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
    aliases: [`cliff`, `heath`, `bortcliff`, `borthcliff`],
    description: 'cliff composition'
  },
  (_ : string, { store } : AdjustedArgs) : Promise<string> => new Promise<string>((resolve, reject) => {
    load(filenames)
      .then(([i, nextFiles]) => {
        load(nextFiles).then(([j]) => {
          const [small, big] = i.bitmap.width < j.bitmap.width ? [i, j] : [j, i]
          big.resize(small.bitmap.width, Jimp.AUTO)

          i.blit(j, 0, i.bitmap.height * 0.9, 0, j.bitmap.height * 0.9, j.bitmap.width, j.bitmap.height * 0.1)

          const nouns = store.getState().get('concepts').get('noun')
          const newFilename = [randomInRange(nouns), randomInRange(nouns), randomInRange(nouns)].join('-')

          i.write(
            path.join(outDir, newFilename + '.jpg'),
            e => {
              if(e) {
                reject(e)
              }
              else {
                resolve('http://' + env.HOSTNAME + `/${outputDirname}/${newFilename}.jpg`)
              }
            })
        })
      })
  })
)


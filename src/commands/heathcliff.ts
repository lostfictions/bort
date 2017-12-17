import { makeCommand } from '../util/handler'
import * as fs from 'fs'
import * as path from 'path'
import * as Jimp from 'jimp'

import { HandlerArgs } from '../handler-args'
import { randomInArray, randomInRange } from '../util'
import { DATA_DIR, HOSTNAME } from '../env'

const outputDirname = 'cliffs'
const outDir = path.join(__dirname, '../../static/', outputDirname)
if(!fs.existsSync(outDir)) {
  console.log(`Heathcliff output directory '${outDir}' not found! creating.`)
  fs.mkdirSync(outDir)
}

const imgDir = path.join(DATA_DIR, 'heathcliff')

let filenames : string[] = []
if(!fs.existsSync(imgDir)) {
  console.error(`Heathcliff source directory '${imgDir}' not found! Heathcliff command will be unavailable.`)
}
else {
  filenames = fs.readdirSync(imgDir)
}

async function load(files : string[]) : Promise<[Jimp, string[]]> {
  const nextFiles = files.slice()

  let img : Jimp
  do {
    const fn = randomInArray(nextFiles)
    nextFiles.splice(nextFiles.indexOf(fn), 1)
    img = await Jimp.read(path.join(imgDir, fn))
  } while(img.bitmap.width > img.bitmap.height) // NO SUNDAYS

  return [img, nextFiles]
}

export default makeCommand<HandlerArgs>(
  {
    name: 'heathcliff',
    aliases: [`cliff`, `heath`, `bortcliff`, `borthcliff`],
    description: 'cliff composition'
  },
  async ({ store }) : Promise<string | false> => {
    if(filenames.length === 0) {
      return false
    }

    const [i, nextFiles] = await load(filenames)

    const [j] = await load(nextFiles)

    const [small, big] = i.bitmap.width < j.bitmap.width ? [i, j] : [j, i]
    big.resize(small.bitmap.width, Jimp.AUTO)

    i.blit(j, 0, i.bitmap.height * 0.9, 0, j.bitmap.height * 0.9, j.bitmap.width, j.bitmap.height * 0.1)

    const nouns = store.getState().get('concepts').get('noun')
    const newFilename = [randomInRange(nouns), randomInRange(nouns), randomInRange(nouns)].join('-')

    return new Promise<string>((res, rej) => {
      i.write(path.join(outDir, newFilename + '.jpg'), e => {
        if(e) {
          rej(e)
        }
        else {
          res(`http://${HOSTNAME}/${outputDirname}/${newFilename}.jpg`)
        }
      })
    })
  }
)

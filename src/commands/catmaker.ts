import { createCommand } from 'chatter'
import * as debug from 'debug'
import { List } from 'immutable'

import { AdjustedArgs } from './AdjustedArgs'
import { ConceptBank } from './concepts'
import { randomByWeight, randomInt, randomInRange } from '../util'

import { USE_CLI } from '../env'

const log = debug('bort:commands:catmaker')
log.enabled = USE_CLI

const enum CatParts {
  Empty = ' ',
  UD = '│',
  LR = '─',
  UL = '┘',
  UR = '└',
  DL = '┐',
  DR = '┌',
  Cross = '┼',
  Start = 'X',
  EndR = '>',
  EndU = '^',
  EndL = '<',
  EndD = 'v'
}

interface PrintConfig {
  sprites : { [part in CatParts] : () => string }
  resultWrapper : (result : string) => string
}

function getConfig(concepts : ConceptBank, palette = 'cat') : PrintConfig {
  let didFallback = false
  const getFromConcepts = (key : string, fallback : string) => {
    const fullKey = `${palette}_${key}`
    if(!concepts.has(fullKey)) {
      didFallback = true
    }
    return () => randomInRange(concepts.get(fullKey, List())) || fallback
  }


  return {
    sprites: {
      [CatParts.Empty]: getFromConcepts('empty', CatParts.Empty),
      [CatParts.UD]: getFromConcepts('ud', CatParts.UD),
      [CatParts.LR]: getFromConcepts('lr', CatParts.LR),
      [CatParts.UL]: getFromConcepts('ul', CatParts.UL),
      [CatParts.UR]: getFromConcepts('ur', CatParts.UR),
      [CatParts.DL]: getFromConcepts('dl', CatParts.DL),
      [CatParts.DR]: getFromConcepts('dr', CatParts.DR),
      [CatParts.Cross]: getFromConcepts('cross', CatParts.Cross),
      [CatParts.Start]: getFromConcepts('start', CatParts.Start),
      // if we have the specific head direction in the concept bank then use it,
      // otherwise fall back to the generic direction, then the generic value
      [CatParts.EndR]: concepts.has(`${palette}_head_right`)
        ? getFromConcepts('head_right', '_neverUsed')
        : getFromConcepts('head', CatParts.EndR),
      [CatParts.EndU]: concepts.has(`${palette}_head_up`)
        ? getFromConcepts('head_up', '_neverUsed')
        : getFromConcepts('head', CatParts.EndU),
      [CatParts.EndL]: concepts.has(`${palette}_head_left`)
        ? getFromConcepts('head_left', '_neverUsed')
        : getFromConcepts('head', CatParts.EndL),
      [CatParts.EndD]: concepts.has(`${palette}_head_down`)
        ? getFromConcepts('head_down', '_neverUsed')
        : getFromConcepts('head', CatParts.EndD)
    },
    resultWrapper: didFallback
      ? (result : string) => `\`\`\`\n${result}\n\`\`\``
      : (result : string) => result
  }
}

function printResult(grid : CatParts[][], config : PrintConfig) : string {
  const rows : string[] = []
  for(let i = gridSizeY - 1; i >= 0; i--) {
    const row = []
    for(let j = 0; j < gridSizeX; j++) {
      row.push(config.sprites[grid[j][i]]())
    }
    rows.push(row.join(''))
  }
  return config.resultWrapper(rows.join('\n'))
}

// Lookup table mapping from directions [right, up, left, down]
// to parts to use and position delta to apply.
interface CatDirection { part : CatParts, delta : [number, number] }
const directions : {
  f : CatDirection
  l : CatDirection
  r : CatDirection
}[] = [
  // facing right
  {
    f: { part: CatParts.LR, delta: [1, 0] },
    l: { part: CatParts.UL, delta: [0, 1] },
    r: { part: CatParts.DL, delta: [0, -1] }
  },
  // facing up
  {
    f: { part: CatParts.UD, delta: [0, 1] },
    l: { part: CatParts.DL, delta: [-1, 0] },
    r: { part: CatParts.DR, delta: [1, 0] }
  },
  // facing left
  {
    f: { part: CatParts.LR, delta: [-1, 0] },
    l: { part: CatParts.DR, delta: [0, -1] },
    r: { part: CatParts.UR, delta: [0, 1] }
  },
  // facing down
  {
    f: { part: CatParts.UD, delta: [0, -1] },
    l: { part: CatParts.UR, delta: [1, 0] },
    r: { part: CatParts.UL, delta: [-1, 0] }
  }
]

interface TurnChance {
  f : number
  l : number
  r : number
}

const gridSizeX = 16
const gridSizeY = 20

const startDirection = 1

const straightSegments = new Set([CatParts.UD, CatParts.LR])

function addCat(grid : CatParts[][], turnChance : TurnChance, minSteps : number, maxSteps : number) : boolean {
  log('new cat!')

  // search for an empty spot to put the cat.
  let attempts = 5
  let x : number
  let y : number
  do {
    x = randomInt(gridSizeX)
    y = Math.max(randomInt(gridSizeY / 2) - 1, 0)
    attempts--
    if(attempts === 0) {
      log(`can't find an empty space!`)
      return false
    }
  } while(grid[x][y] !== CatParts.Empty || grid[x][y + 1] !== CatParts.Empty)

  // we can infer previous steps if we need to backtrack, but this is simpler
  const steps : { prevSprite : string, delta : [number, number] }[] = []

  // lay initial sprite.
  grid[x][y] = CatParts.Start
  y += 1
  let dir = startDirection

  let stepsLeft = randomInt(minSteps, maxSteps)
  do {
    // log(`steps left: ${stepsLeft}`)
    ////////////////////////////
    // log full state at each step.
    // if(USE_CLI) {
    //   const rows : string[] = []
    //   for(let i = gridSizeY - 1; i >= 0; i--) {
    //     const row = []
    //     for(let j = 0; j < gridSizeX; j++) {
    //       row.push(grid[j][i])
    //     }
    //     rows.push(row.join(','))
    //   }
    //   log('state:')
    //   log(rows.join('\n'))
    // }
    ////////////////////////////

    // we should only have been placed in a non-empty sprite if we're doing a crossover
    if(grid[x][y] !== CatParts.Empty) {
      if(((dir === 1 || dir === 3) && grid[x][y] === directions[0].f.part) ||
        ((dir === 0 || dir === 2) && grid[x][y] === directions[1].f.part)) {
        grid[x][y] = CatParts.Cross
        const [dX, dY] = directions[dir].f.delta
        x += dX
        y += dY
        // log(`crossover! pos now [${x},${y}]`)
        // continue immediately! don't reduce steps for crossover
        continue
      }
      console.warn(`Expected empty sprite at [${x},${y}], found ${grid[x][y]}`)
    }

    const nextDirections = directions[dir]

    // remove all invalid turns:
    const validTurns = { ...turnChance }
    for(const [nextDir, { delta: [dX, dY] }] of Object.entries(nextDirections)) {
      // don't go out of bounds, and stop 1 below the top row so we always have
      // space for the head
      if(x + dX < 0 || x + dX >= gridSizeX || y + dY < 0 || y + dY >= gridSizeY - 1) {
        // log(`deleting ${nextDir}`)
        delete (validTurns as any)[nextDir]
        continue
      }

      // if the cell is occupied and we're not going forward, this isn't a valid direction.
      if(grid[x + dX][y + dY] !== CatParts.Empty && nextDir !== 'f') {
        delete (validTurns as any)[nextDir]
        continue
      }

      // don't go over non-empty cells, UNLESS the direction is forward and the
      // segment is a straight that's perpendicular -- we'll make it a crossover.
      let xToCheck = x
      let yToCheck = y
      let shouldDelete = false
      do {
        xToCheck = xToCheck + dX
        yToCheck = yToCheck + dY
        if(xToCheck < 0 || xToCheck >= gridSizeX || yToCheck < 0 || yToCheck >= gridSizeY) {
          shouldDelete = true
          break
        }
        // if it's an empty space above, we can go in that direction.
        if(grid[xToCheck][yToCheck] === CatParts.Empty) break
        // if it's anything except an empty space or a straight segment, we can't go in that direction.
        if(!straightSegments.has(grid[xToCheck][yToCheck])) { shouldDelete = true; break }
        // if it's a straight segment, check the same conditions for the next space in that direction.
      } while(true)
      if(shouldDelete) {
        delete (validTurns as any)[nextDir]
      }
    }

    if(Object.keys(validTurns).length === 0) {
      log('no valid turns')
      break
    }

    // update our current position and facing
    {
      const nextDirection = randomByWeight(validTurns)
      const { part, delta: [dX, dY] } = nextDirections[nextDirection]

      steps.push({ prevSprite: grid[x][y], delta: [dX, dY] })

      grid[x][y] = part
      x += dX
      y += dY
      // log(`pos now [${x},${y}]`)

      if(nextDirection === 'l') {
        dir = (dir + 1) % 4
      }
      else if(nextDirection === 'r') {
        dir = dir - 1
        if(dir === -1) dir = 3
      }
    }

    // FIXME: if the next step will be a crossover, we shouldn't subtract
    // steps-- we might end on a cross segment.
    stepsLeft--
  } while(stepsLeft > 0)

  switch(dir) {
    case 0: grid[x][y] = CatParts.EndR; break
    case 1: grid[x][y] = CatParts.EndU; break
    case 2: grid[x][y] = CatParts.EndL; break
    case 3: grid[x][y] = CatParts.EndD; break
    default: throw new Error('unknown direction')
  }
  return true
}


// The main command.

export default createCommand(
  {
    name: 'cat',
    description: 'get cat'
  },
  (message : string, { store } : AdjustedArgs) : string => {
    const config = {
      catchance: 50,
      leftchance: 50,
      rightchance: 50,
      straightchance: 50,
      minsteps: randomInt(2, 20),
      maxsteps: randomInt(30, 60)
    }
    const configAliases = {
      catchance: 'catchance',
      leftchance: 'leftchance',
      rightchance: 'rightchance',
      straightchance: 'straightchance',
      minsteps: 'minsteps',
      maxsteps: 'maxsteps',

      chance: 'catchance',
      cat: 'catchance',
      c: 'catchance',
      left: 'leftchance',
      l: 'leftchance',
      right: 'rightchance',
      r: 'rightchance',
      straight: 'straightchance',
      forward: 'straightchance',
      f: 'straightchance',
      min: 'minsteps',
      max: 'maxsteps',
      steps: 'maxsteps', // see below
      s: 'maxsteps',     // see below
      num: 'maxsteps',   // see below
      n: 'maxsteps',     // see below
      length: 'maxsteps' // see below
    }
    if(message.length > 0) {
      const argMatcher = /^([a-zA-Z]+)=([0-9]+)$/
      const chunks = message.split(' ')
      chunks.forEach(chunk => {
        const res = argMatcher.exec(chunk)
        if(res) {
          const [, argName, value] = res
          if(argName.toLowerCase() in configAliases) {
            const parsedVal = parseInt(value, 10)
            if(!isNaN(parsedVal) && parsedVal >= 0) {
              (config as any)[
                (configAliases as any)[argName.toLowerCase()]
              ] = parsedVal

              // HACK: these aliases set min and max to the same value
              if(['steps', 's', 'num', 'n', 'length'].includes(argName)) {
                config.minsteps = parsedVal
              }
            }
          }
        }
      })
    }
    log(config)

    // only add turn chances to our object if they're nonzero!
    // we remove entries when checking turns, and randomByWeight
    // will fail if there's only zero-weighted values in the object.
    const turnChance : any = {}
    if(config.leftchance > 0) turnChance.l = config.leftchance
    if(config.rightchance > 0) turnChance.r = config.rightchance
    if(config.straightchance > 0) turnChance.f = config.straightchance


    const printConfig = getConfig(store.getState().get('concepts'))

    const grid : CatParts[][] = []
    for(let i = 0; i < gridSizeX; i++) {
      grid[i] = Array<CatParts>(gridSizeY).fill(CatParts.Empty)
    }

    let lastAddSucceeded = addCat(grid, turnChance, config.minsteps, config.maxsteps)

    while(Math.random() < config.catchance / 100 && lastAddSucceeded) {
      lastAddSucceeded = addCat(grid, turnChance, config.minsteps, config.maxsteps)
    }

    return printResult(grid, printConfig)
  }
)

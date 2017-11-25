import { createCommand } from 'chatter'
import { env } from '../env'

import { randomByWeight, WeightedValues, randomInt } from '../util'


// const crossoverSprite = [':catcross1:', ':catcross2:']

interface CatDirection {
  sprite : string
  delta : [number, number]
}
interface CatConfig {
  emptySprite : string
  startSprite : string
  headSprites : WeightedValues
  crossoverSprites : WeightedValues
  directions : {
    f : CatDirection
    l : CatDirection
    r : CatDirection
  }[]
  /** We may want to wrap the result in a block, eg ensure monospace formatting. */
  wrapResult : (result : string) => string
}

function getConfig(isBpf : boolean) : CatConfig {
  if(isBpf) {
    return {
      emptySprite: ':catspace:',
      startSprite: ':catbot:',
      headSprites: {
        ':cattop:': 120,
        ':cattoprev:': 50,
        ':chapo:': 1,
        ':dmx:': 1,
        ':dncash:': 1,
        ':drago:': 1,
        ':gape:': 2,
        ':hayao:': 2,
        ':heathcliff:': 5,
        ':hi:': 3,
        ':kuchi:': 5,
        ':murphy:': 1,
        ':robocop:': 1
      },
      crossoverSprites: {
        ':catcross1:': 1,
        ':catcross2:': 1
      },
      directions: [
        // facing right
        {
          f: { sprite: ':catlr:', delta: [ 1,  0] },
          l: { sprite: ':catul:', delta: [ 0,  1] },
          r: { sprite: ':catld:', delta: [ 0, -1] }
        },
        // facing up
        {
          f: { sprite: ':catud:', delta: [ 0,  1] },
          l: { sprite: ':catld:', delta: [-1,  0] },
          r: { sprite: ':catdr:', delta: [ 1,  0] }
        },
        // facing left
        {
          f: { sprite: ':catlr:', delta: [-1,  0] },
          l: { sprite: ':catdr:', delta: [ 0, -1] },
          r: { sprite: ':catur:', delta: [ 0,  1] }
        },
        // facing down
        {
          f: { sprite: ':catud:', delta: [ 0, -1] },
          l: { sprite: ':catur:', delta: [ 1,  0] },
          r: { sprite: ':catul:', delta: [-1,  0] }
        }
      ],
      wrapResult: result => result
    }
  }
  return {
    emptySprite: ' ',
    startSprite: 'X',
    headSprites: { O: 1 },
    crossoverSprites: { '┼': 1 },
    directions: [
      // facing right
      {
        f: { sprite: '─', delta: [ 1,  0] },
        l: { sprite: '┘', delta: [ 0,  1] },
        r: { sprite: '┐', delta: [ 0, -1] }
      },
      // facing up
      {
        f: { sprite: '│', delta: [ 0,  1] },
        l: { sprite: '┐', delta: [-1,  0] },
        r: { sprite: '┌', delta: [ 1,  0] }
      },
      // facing left
      {
        f: { sprite: '─', delta: [-1,  0] },
        l: { sprite: '┌', delta: [ 0, -1] },
        r: { sprite: '└', delta: [ 0,  1] }
      },
      // facing down
      {
        f: { sprite: '│', delta: [ 0, -1] },
        l: { sprite: '└', delta: [ 1,  0] },
        r: { sprite: '┘', delta: [-1,  0] }
      }
    ],
    wrapResult: result => `\`\`\`\n${result}\n\`\`\``
  }
}


interface TurnChance {
  f : number
  l : number
  r : number
}

const sizeX = 16
const sizeY = 20

const startDirection = 1

const defaultExtraCatChance = 0.5
const defaultTurnChance : TurnChance = {
  f: 1,
  l: 1,
  r: 1
}

function addCat(grid : string[][], config : CatConfig, turnChance : TurnChance) : boolean {
  const {
    emptySprite,
    startSprite,
    crossoverSprites,
    directions,
    headSprites
  } = config

  // search for an empty spot to put the cat.
  let attempts = 5
  let x : number
  let y : number
  do {
    x = randomInt(sizeX)
    y = Math.max(randomInt(sizeY / 2) - 1, 0)
    attempts--
    if(attempts === 0) {
      return false
    }
  } while(grid[x][y] !== emptySprite || grid[x][y + 1] !== emptySprite)

  // lay initial sprite.
  grid[x][y] = startSprite
  y += 1
  let dir = startDirection

  let steps = randomInt(20, 100)
  do {
    ////////////////////////////
    // log steps
    // const rows : string[] = []
    // for(let i = sizeY - 1; i >= 0; i--) {
    //   const row = []
    //   for(let j = 0; j < sizeX; j++) {
    //     row.push(grid[j][i])
    //   }
    //   rows.push(row.join(','))
    // }
    // console.log('state:')
    // console.log(rows.join('\n'))
    ////////////////////////////

    const nextDirections = directions[dir]

    // remove all invalid turns
    const validTurns = { ...turnChance }
    for(const [dir, { delta: [dX, dY] }] of Object.entries(nextDirections)) {
      // don't go out of bounds, and stop 1 below the top row so we always have space for the head
      if(
        x + dX < 0 || x + dX >= sizeX ||
        y + dY < 0 || y + dY >= sizeY - 1 ||
        grid[x + dX][y + dY] !== emptySprite
      ) {
        delete (validTurns as any)[dir]
      }
    }

    if(Object.keys(validTurns).length === 0) {
      break
    }

    const nextDirection = randomByWeight(validTurns)
    const { sprite, delta: [dX, dY] } = nextDirections[nextDirection]
    grid[x][y] = sprite
    x += dX
    y += dY

    if(nextDirection === 'l') {
      dir = (dir + 1) % 4
    }
    else if(nextDirection === 'r') {
      dir = dir - 1
      if(dir === -1) dir = 3
    }

    steps--
  } while(steps > 0)

  // end by moving up and placing the head.
  switch(dir) {
    case 0: grid[x][y] = directions[dir].l.sprite; break;
    case 1: grid[x][y] = directions[dir].f.sprite; break;
    case 2: grid[x][y] = directions[dir].r.sprite; break;
    case 3: {
      // if we're facing down, we have a bit of a tricky situation. we can't
      // move straight up, so we want to backtrack and change the last sprite
      // to face up. except the last sprite could be '┐', '┌', or '│', and if
      // it's the latter, we have to keep backtracking until we hit a
      // different direction.
      grid[x][y] = emptySprite
      y = y + 1
      while(grid[x][y] === directions[3].f.sprite) {
        grid[x][y] = emptySprite
        y = y + 1
      }
      if(grid[x][y] === directions[0].r.sprite) { // ┐
        grid[x][y] = directions[0].l.sprite
      }
      else {
        grid[x][y] = directions[2].r.sprite
      }
    }
  }
  grid[x][y + 1] = randomByWeight(headSprites)
  return true
}

export default createCommand(
  {
    name: 'cat',
    description: 'get cat',
    usage: '[extra cat chance [go left chance [go right chance [go straight chance]]]]'
  },
  (message : string) : string => {
    const turnChance = { ...defaultTurnChance }
    let extraCatChance = defaultExtraCatChance
    if(message.length > 0) {
      const [chance, l, r, f] = message.split(' ')
        .map(n => parseInt(n, 10))
        .filter(n => !isNaN(n)) as (number | undefined)[]

      if(typeof chance === 'number') extraCatChance = chance / 100
      if(typeof l === 'number') turnChance.l = l
      if(typeof r === 'number') turnChance.r = r
      if(typeof f === 'number') turnChance.f = f
    }

    // TODO: handle per-server via store
    const config = getConfig(!env.USE_CLI)

    const grid : string[][] = []
    for(let i = 0; i < sizeX; i++) {
      grid[i] = Array<string>(sizeY).fill(config.emptySprite)
    }

    let lastAddSucceeded = addCat(grid, config, turnChance)

    while(Math.random() < extraCatChance && lastAddSucceeded) {
      lastAddSucceeded = addCat(grid, config, turnChance)
    }

    // print out the result.
    const rows : string[] = []
    for(let i = sizeY - 1; i >= 0; i--) {
      const row = []
      for(let j = 0; j < sizeX; j++) {
        row.push(grid[j][i])
      }
      rows.push(row.join(''))
    }
    return config.wrapResult(rows.join('\n'))
  }
)

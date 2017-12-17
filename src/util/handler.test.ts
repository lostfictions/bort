import { processMessage, makeCommand, Handler } from './handler'

describe('processMessage', () => {
  it('should resolve a handler function to false', () =>
    expect(processMessage(() => false, { message: 'yo' })).resolves.toBe(false)
  )

  it('should resolve a handler function to a message', () =>
    expect(processMessage(({ message }) => message, { message: 'yo' })).resolves.toBe('yo')
  )

  it('should resolve a handler object to false', () =>
    expect(processMessage({ handleMessage: () => false }, { message: 'yo' })).resolves.toBe(false)
  )

  it('should resolve a handler object to a message', () =>
    expect(processMessage({ handleMessage: ({ message }) => message }, { message: 'yo' })).resolves.toBe('yo')
  )

  it('should resolve a handler object returning a promise to a message', () =>
    expect(processMessage(
      {
        handleMessage: ({ message }) => new Promise<string>(res => res(message))
      },
      { message: 'yo' }
    )).resolves.toBe('yo')
  )

  it('should resolve an array of handler objects and functions to a message', () => {
    const handlers : Handler<{ message : string }, string>[] = [
      { handleMessage: () => false },
      () => new Promise<false>(res => res(false)),
      ({ message }) => message,
      () => { throw new Error('should not be called') }
    ]
    return expect(processMessage(handlers, { message: 'yo' })).resolves.toBe('yo')
  })

  it('should resolve an array of handler objects and functions to false if none matches', () => {
    const handlers : Handler<{ message : string }, string>[] = [
      { handleMessage: () => false },
      { handleMessage: () => new Promise<false>(res => { setTimeout(res(false)) }) },
      ({ message }) => message,
      () => { throw new Error('should not be called') }
    ]
    return expect(processMessage(handlers, { message: 'yo' })).resolves.toBe('yo')
  })
})

describe('makeCommand', () => {
  it('should resolve a command to a message', () =>
    expect(
      processMessage(makeCommand({ name: 'butt' }, ({ message }) => message), { message : 'butt mess' })
    ).resolves.toBe('mess')
  )

  it('should resolve a command with nested handlers to a message', () => {
    const handlers : Handler<{ message : string }, string>[] = [
      { handleMessage: () => false },
      { handleMessage: () => new Promise<false>(res => { setTimeout(res(false)) }) },
      ({ message }) => message,
      () => { throw new Error('should not be called') }
    ]

    return expect(
      processMessage(makeCommand({ name: 'butt' }, handlers), { message: 'butt mess' })
    ).resolves.toBe('mess')
  })
})


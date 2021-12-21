import * as assert from 'assert'
import * as Wonka from 'wonka'
import { pipe } from 'fp-ts/function'
import { append } from 'fp-ts/ReadonlyArray'
import { makeSubject } from 'wonka'
import { program } from '../src/program'

type TestState = ReadonlyArray<string>
type TestAction = { type: 'foo' } | { type: 'bar' } | { type: 'baz' }

const update = (state: TestState, action: TestAction): TestState => {
  return pipe(state, append(action.type as string))
}

describe('program()', () => {
  it('should return the Model stream and Dispatch function', () => {
    const models: TestState[] = []
    const { model$, dispatch } = program([], update)

    pipe(
      model$,
      Wonka.subscribe((v) => {
        models.push(v)
      })
    )

    dispatch({ type: 'foo' })
    dispatch({ type: 'bar' })
    dispatch({ type: 'baz' })

    assert.deepStrictEqual(models, [
      ['foo'],
      ['foo', 'bar'],
      ['foo', 'bar', 'baz']
    ])
  })

  it('should stop the Program when a signal is emitted', async () => {
    const stop = makeSubject()

    const models: TestState[] = []
    const { model$, dispatch } = program([], update, stop.source)

    pipe(
      model$,
      Wonka.subscribe((v) => {
        models.push(v)
      })
    )

    dispatch({ type: 'foo' })
    dispatch({ type: 'bar' })

    stop.next('stop')

    dispatch({ type: 'baz' })

    assert.deepStrictEqual(models, [['foo'], ['foo', 'bar']])
  })
})

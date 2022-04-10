import assert from 'assert'
import { eqStrict } from 'fp-ts/Eq'
import { pipe } from 'fp-ts/function'
import { fromArray, toArray } from 'wonka'
import { skipUntilChanged } from '../src/operators'

describe('skipUntilChanged', () => {
  it('skips until value is changed', () => {
    const input = [1, 1, 2, 2, 2, 3]
    const events = pipe(fromArray(input), skipUntilChanged(eqStrict), toArray)

    assert.deepStrictEqual(events, [1, 2, 3])
  })
})

import assert from 'assert'
import {
  Operation,
  Client,
  makeErrorResult,
  ExchangeInput,
  CombinedError
} from 'urql'
import { renderHook, act } from '@testing-library/react-hooks'
import { pipe } from 'fp-ts/lib/function'
import { map, makeSubject, publish, filter, Subject, Source } from 'wonka'
import { some } from 'fp-ts/lib/Option'
import { networkStatusExchange } from '../src'
import {
  networkStatusProgram,
  emptyNetworkStatus,
  NetworkStatusProgram,
  operationError
} from '../src/state'
import { queryOperation, queryResult } from './utils'
import { createUseUrqlNetworkStatus } from '../src/useUrqlNetworkStatus'

const error = new Error('')
const combinedError = new CombinedError({
  networkError: error
})
const errorResult = makeErrorResult(queryOperation, error)

const dispatchDebug = jest.fn()

let shouldRespond = false
let shouldError = false
let exchangeArgs: ExchangeInput
let input: Subject<Operation>
let program: NetworkStatusProgram

beforeEach(() => {
  shouldRespond = false
  shouldError = false
  input = makeSubject<Operation>()
  program = networkStatusProgram()

  const forward = (s: Source<Operation>) => {
    return pipe(
      s,
      map(() => {
        if (shouldError) {
          return errorResult
        }

        return queryResult
      }),
      filter(() => !!shouldRespond)
    )
  }

  exchangeArgs = { forward, client: {} as Client, dispatchDebug }
})

describe('useUrqlNetworkStatus', () => {
  it('should render', () => {
    const { source: ops$, next, complete } = input
    const exchange = networkStatusExchange(program)(exchangeArgs)(ops$)
    const useUrqlNetworkStatus = createUseUrqlNetworkStatus(program)

    const { result } = renderHook(() => useUrqlNetworkStatus())

    assert.deepStrictEqual(result.current, emptyNetworkStatus)

    act(() => {
      publish(exchange)
      next(queryOperation)
      complete()
    })

    assert.deepStrictEqual(result.current, {
      ...emptyNetworkStatus,
      query: {
        ...emptyNetworkStatus.query,
        pending: [queryOperation]
      }
    })
  })

  it('handles errors', () => {
    shouldError = true
    shouldRespond = true

    const { source: ops$, next, complete } = input
    const exchange = networkStatusExchange(program)(exchangeArgs)(ops$)
    const useUrqlNetworkStatus = createUseUrqlNetworkStatus(program)

    const { result } = renderHook(() => useUrqlNetworkStatus())

    assert.deepStrictEqual(result.current, emptyNetworkStatus)

    act(() => {
      publish(exchange)
      next(queryOperation)
      complete()
    })

    assert.deepStrictEqual(result.current, {
      ...emptyNetworkStatus,
      query: {
        ...emptyNetworkStatus.query,
        latestError: some(
          operationError({
            operation: queryOperation,
            error: combinedError
          })
        )
      }
    })
  })
})

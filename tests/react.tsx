import React from 'react'
import assert from 'assert'
import {
  Operation,
  Client,
  makeErrorResult,
  ExchangeInput,
  CombinedError,
  Provider
} from 'urql'
import { renderHook, act } from '@testing-library/react-hooks'
import { pipe } from 'fp-ts/lib/function'
import { map, makeSubject, publish, filter, Subject, Source } from 'wonka'
import { some } from 'fp-ts/lib/Option'
import { networkStatusExchange } from '../src'
import {
  emptyNetworkStatus,
  NetworkStatusProgram,
  operationError
} from '../src/state'
import { queryOperation, queryResult } from './utils'
import { useUrqlNetworkStatus } from '../src/react'

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
let client: Client

beforeEach(() => {
  shouldRespond = false
  shouldError = false
  input = makeSubject<Operation>()

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

  client = {
    _networkStatus: program
  } as any as Client

  exchangeArgs = { forward, client, dispatchDebug }
})

describe('useUrqlNetworkStatus', () => {
  it('should render', () => {
    const { source: ops$, next, complete } = input
    const exchange = networkStatusExchange()(exchangeArgs)(ops$)

    const { result } = renderHook(() => useUrqlNetworkStatus(), {
      wrapper: ({ children }) => <Provider value={client}>{children}</Provider>
    })

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
    const exchange = networkStatusExchange()(exchangeArgs)(ops$)

    const { result } = renderHook(() => useUrqlNetworkStatus(), {
      wrapper: ({ children }) => <Provider value={client}>{children}</Provider>
    })

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

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
import { networkStatusExchange } from '../src'
import { emptyOperationsState, OperationsStateProgram } from '../src/state'
import { queryOperation, queryResult } from './utils'
import { useUrqlOperationsStatus } from '../src/react'
import { operationError } from '../src/OperationError'
import * as OperationStatus from '../src/OperationStatus'
import { ClientWithOperationsStatusState } from '../src/networkStatusExchange'

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
let program: OperationsStateProgram
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
    _operationsStatusState: program
  } as any as ClientWithOperationsStatusState

  exchangeArgs = { forward, client, dispatchDebug }
})

describe('useUrqlOperationsStatus', () => {
  it('should render', () => {
    const { source: ops$, next, complete } = input
    const exchange = networkStatusExchange()(exchangeArgs)(ops$)

    const { result } = renderHook(() => useUrqlOperationsStatus(), {
      wrapper: ({ children }) => <Provider value={client}>{children}</Provider>
    })

    assert.deepStrictEqual(result.current, emptyOperationsState)

    act(() => {
      publish(exchange)
      next(queryOperation)
      complete()
    })

    assert.deepStrictEqual(result.current, {
      ...emptyOperationsState,
      query: OperationStatus.pending([queryOperation])
    })
  })

  it('handles errors', () => {
    shouldError = true
    shouldRespond = true

    const { source: ops$, next, complete } = input
    const exchange = networkStatusExchange()(exchangeArgs)(ops$)

    const { result } = renderHook(() => useUrqlOperationsStatus(), {
      wrapper: ({ children }) => <Provider value={client}>{children}</Provider>
    })

    assert.deepStrictEqual(result.current, emptyOperationsState)

    act(() => {
      publish(exchange)
      next(queryOperation)
      complete()
    })

    assert.deepStrictEqual(result.current, {
      ...emptyOperationsState,
      query: OperationStatus.failure([
        operationError({
          operation: queryOperation,
          error: combinedError
        })
      ])
    })
  })
})

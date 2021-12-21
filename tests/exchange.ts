import {
  Operation,
  Client,
  CombinedError,
  makeErrorResult,
  ExchangeInput
} from 'urql'
import { makeSubject, pipe, map, publish, Subject, Source } from 'wonka'
import { queryResult, queryOperation, subscriptionOperation } from './utils'
import {
  NetworkStatusProgram,
  NetworkStatusAction,
  networkStatusActionError
} from '../src/state'
import { networkStatusExchange } from '../src/networkStatusExchange'

const error = new Error('')
const combinedError = new CombinedError({
  networkError: error
})
const errorResult = makeErrorResult(queryOperation, error)

const dispatchDebug = jest.fn()

let shouldError = false
let exchangeArgs: ExchangeInput
let input: Subject<Operation>
let program: NetworkStatusProgram

beforeEach(() => {
  shouldError = false
  input = makeSubject<Operation>()
  program = {
    dispatch: jest.fn<void, [NetworkStatusAction]>()
  } as any as NetworkStatusProgram

  const forward = (ops$: Source<Operation>) => {
    return pipe(
      ops$,
      map(() => {
        if (shouldError) {
          return errorResult
        }

        return queryResult
      })
    )
  }

  exchangeArgs = { forward, client: {} as Client, dispatchDebug }
})

describe('networkStatusExchange', () => {
  it('handles successful requests', () => {
    const { source: ops$, next, complete } = input
    const exchange = networkStatusExchange(program)(exchangeArgs)(ops$)

    publish(exchange)
    next(queryOperation)
    complete()

    expect(program.dispatch).toBeCalledTimes(2)
    expect(program.dispatch).toHaveBeenNthCalledWith(1, {
      type: 'Request',
      payload: {
        operation: queryOperation
      }
    })
    expect(program.dispatch).toHaveBeenNthCalledWith(2, {
      type: 'Success',
      payload: {
        operation: queryOperation,
        result: queryResult
      }
    })
  })

  it('handles error responses', () => {
    shouldError = true

    const { source: ops$, next, complete } = input
    const exchange = networkStatusExchange(program)(exchangeArgs)(ops$)

    publish(exchange)
    next(queryOperation)
    complete()

    expect(program.dispatch).toBeCalledTimes(2)
    expect(program.dispatch).toHaveBeenNthCalledWith(1, {
      type: 'Request',
      payload: {
        operation: queryOperation
      }
    })
    expect(program.dispatch).toHaveBeenNthCalledWith(
      2,
      networkStatusActionError(queryOperation, combinedError)
    )
  })

  it('ignores irrelevant operations', () => {
    const { source: ops$, next, complete } = input
    const exchange = networkStatusExchange(program)(exchangeArgs)(ops$)

    publish(exchange)
    next(subscriptionOperation)
    complete()

    expect(program.dispatch).toBeCalledTimes(0)
  })
})

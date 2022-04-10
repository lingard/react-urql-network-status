import {
  Operation,
  Client,
  CombinedError,
  makeErrorResult,
  ExchangeInput
} from 'urql'
import { makeSubject, pipe, map, publish, Subject, Source } from 'wonka'
import { queryResult, queryOperation, subscriptionOperation } from './utils'
import { OperationsStateProgram } from '../src/state'
import { createOperationsStatusExchange } from '../src/networkStatusExchange'
import {
  operationErrorEvent,
  OperationEvent,
  operationRequestEvent,
  operationSuccessEvent
} from '../src/OperationEvent'

const error = new Error('')
const combinedError = new CombinedError({
  networkError: error
})
const errorResult = makeErrorResult(queryOperation, error)

const dispatchDebug = jest.fn()

let shouldError = false
let exchangeArgs: ExchangeInput
let input: Subject<Operation>
let program: OperationsStateProgram

beforeEach(() => {
  shouldError = false
  input = makeSubject<Operation>()
  program = {
    dispatch: jest.fn<void, [OperationEvent]>()
  } as any as OperationsStateProgram

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
    const exchange = createOperationsStatusExchange(program)(exchangeArgs)(ops$)

    publish(exchange)
    next(queryOperation)
    complete()

    expect(program.dispatch).toBeCalledTimes(2)
    expect(program.dispatch).toHaveBeenNthCalledWith(
      1,
      operationRequestEvent(queryOperation)
    )
    expect(program.dispatch).toHaveBeenNthCalledWith(
      2,
      operationSuccessEvent(queryOperation, queryResult)
    )
  })

  it('handles error responses', () => {
    shouldError = true

    const { source: ops$, next, complete } = input
    const exchange = createOperationsStatusExchange(program)(exchangeArgs)(ops$)

    publish(exchange)
    next(queryOperation)
    complete()

    expect(program.dispatch).toBeCalledTimes(2)
    expect(program.dispatch).toHaveBeenNthCalledWith(
      1,
      operationRequestEvent(queryOperation)
    )
    expect(program.dispatch).toHaveBeenNthCalledWith(
      2,
      operationErrorEvent(queryOperation, combinedError)
    )
  })

  it('ignores irrelevant operations', () => {
    const { source: ops$, next, complete } = input
    const exchange = createOperationsStatusExchange(program)(exchangeArgs)(ops$)

    publish(exchange)
    next(subscriptionOperation)
    complete()

    expect(program.dispatch).toBeCalledTimes(0)
  })
})

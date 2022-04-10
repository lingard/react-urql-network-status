import { Exchange, Operation, Client, OperationType } from 'urql'
import { tap, filter, share, merge } from 'wonka'
import * as P from 'fp-ts/Predicate'
import { pipe } from 'fp-ts/function'
import * as S from './state'
import * as OperationEvent from './OperationEvent'

const isOperationType = (type: OperationType) => (operation: Operation) =>
  operation.kind === type

const shouldHandleOperationType = pipe(
  isOperationType('mutation'),
  P.or(isOperationType('query'))
)

export interface ClientWithOperationsStatusState extends Client {
  operationQueue$: S.OperationsStateProgram
}

export const createOperationsStatusExchange =
  (state: S.OperationsStateProgram): Exchange =>
  ({ forward, client }) =>
  (ops$) => {
    const sharedOps$ = pipe(ops$, share)

    Object.assign(client, { _operationsStatusState: state })

    const operations$ = pipe(
      ops$,
      filter(shouldHandleOperationType),
      tap((operation) => {
        state.dispatch(OperationEvent.operationRequestEvent(operation))
      }),
      forward,
      tap((result) => {
        state.dispatch(
          OperationEvent.operationSuccessEvent(result.operation, result)
        )
      })
    )

    const rest$ = pipe(
      sharedOps$,
      filter(P.not(shouldHandleOperationType)),
      forward
    )

    return merge([operations$, rest$])
  }

export const networkStatusExchange = () =>
  createOperationsStatusExchange(S.operationsStateProgram())

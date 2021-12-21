import { Exchange, Operation, Client, OperationType } from 'urql'
import { tap, filter, share, merge } from 'wonka'
import * as P from 'fp-ts/Predicate'
import { pipe } from 'fp-ts/function'
import { NetworkStatusProgram } from './state'

const isOperationType = (type: OperationType) => (operation: Operation) =>
  operation.kind === type

const isSuspenseOpertion = (client: Client) => (operation: Operation) =>
  client.suspense &&
  (!operation.context || operation.context.suspense !== false)

const shouldHandleOperationType = pipe(
  isOperationType('mutation'),
  P.or(isOperationType('query'))
)

const shouldHandleOperation = (client: Client) =>
  pipe(shouldHandleOperationType, P.and(P.not(isSuspenseOpertion(client))))

export const networkStatusExchange =
  (program: NetworkStatusProgram): Exchange =>
  ({ forward, client }) =>
  (ops$) => {
    const sharedOps$ = pipe(ops$, share)
    const shouldHandle = shouldHandleOperation(client)

    const operations$ = pipe(
      ops$,
      filter(shouldHandleOperationType),
      tap((operation) => {
        program.dispatch({
          type: 'Request',
          payload: {
            operation
          }
        })
      }),
      forward,
      tap((result) => {
        if (result.error) {
          program.dispatch({
            type: 'Error',
            payload: {
              operation: result.operation,
              error: result.error
            }
          })

          return
        }

        program.dispatch({
          type: 'Success',
          payload: {
            operation: result.operation,
            result
          }
        })
      })
    )

    const rest$ = pipe(sharedOps$, filter(P.not(shouldHandle)), forward)

    return merge([operations$, rest$])
  }

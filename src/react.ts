import { useEffect, useState } from 'react'
import { constant, identity, pipe } from 'fp-ts/function'
import * as Eq from 'fp-ts/Eq'
import * as RA from 'fp-ts/ReadonlyArray'
import { map, subscribe } from 'wonka'
import { Operation, useClient } from 'urql'
import * as OperationStatus from './OperationStatus'
import { ClientWithOperationsStatusState } from './networkStatusExchange'
import { skipUntilChanged } from './operators'
import { emptyOperationsState, OperationsState } from './state'

export const useOperationsStateSubscription = <A>(
  fa: (state: OperationsState) => A,
  empty: A,
  eq: Eq.Eq<A> = Eq.eqStrict
): A => {
  const client = useClient() as ClientWithOperationsStatusState
  const [state, setState] = useState(empty)

  useEffect(() => {
    const subscription = pipe(
      client._operationsStatusState.model$,
      map(fa),
      skipUntilChanged(eq),
      subscribe(setState)
    )

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eq, fa])

  return state
}

export const useUrqlOperationsStatus = () =>
  useOperationsStateSubscription(identity, emptyOperationsState, Eq.eqStrict)

const constEmptyOperations = constant([] as ReadonlyArray<Operation>)

const pendingOperations =
  (operationType: keyof OperationsState) =>
  (status: OperationsState): ReadonlyArray<Operation> =>
    pipe(
      status[operationType],
      OperationStatus.match(
        constEmptyOperations,
        constEmptyOperations,
        identity
      )
    )

export const usePendingQueries = () =>
  useOperationsStateSubscription(pendingOperations('query'), [])

export const usePendingMutations = () =>
  useOperationsStateSubscription(pendingOperations('mutation'), [])

const numPendingOperations = (status: OperationsState) =>
  pipe(
    status,
    pendingOperations('mutation'),
    RA.concat(pipe(status, pendingOperations('mutation'))),
    (operations) => operations.length
  )

export const useNumPendingOperations = () =>
  useOperationsStateSubscription(numPendingOperations, 0)

// const getError = (state: OperationsState) =>
//   pipe(
//     state.query.latestError,
//     O.alt(() => state.mutation.latestError)
//   )

// const eqError: Eq.Eq<O.Option<OperationError>> = O.getEq(Eq.eqStrict)

// export const useError = () =>
//   useOperationsStateSubscription(getError, O.none, eqError)

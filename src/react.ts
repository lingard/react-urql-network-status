import { useEffect, useState } from 'react'
import { identity, pipe } from 'fp-ts/function'
import * as Eq from 'fp-ts/Eq'
import * as O from 'fp-ts/Option'
import { map, subscribe } from 'wonka'
import { useClient } from 'urql'
import { emptyNetworkStatus, NetworkStatus, OperationError } from './state'
import { ClientWithNetworkStatus } from './networkStatusExchange'
import { skipUntilChanged } from './operators'

export const useNetworkStatusSubscription = <A>(
  fa: (state: NetworkStatus) => A,
  empty: A,
  eq: Eq.Eq<A> = Eq.eqStrict
): A => {
  const client = useClient() as ClientWithNetworkStatus
  const [state, setState] = useState(empty)

  useEffect(() => {
    const subscription = pipe(
      client._networkStatus.model$,
      map(fa),
      skipUntilChanged(eq),
      subscribe(setState)
    )

    return () => subscription.unsubscribe()
  }, [client._networkStatus.model$, eq, fa])

  return state
}

export const useUrqlNetworkStatus = () =>
  useNetworkStatusSubscription(identity, emptyNetworkStatus)

const pendingQueries = (status: NetworkStatus) => status.query.pending

export const usePendingQueries = () =>
  useNetworkStatusSubscription(pendingQueries, [])

const pendingMutations = (status: NetworkStatus) => status.mutation.pending

export const usePendingMutations = () =>
  useNetworkStatusSubscription(pendingMutations, [])

const numPendingOperations = (status: NetworkStatus) =>
  status.query.pending.length + status.mutation.pending.length

export const useNumPendingOperations = () =>
  useNetworkStatusSubscription(numPendingOperations, 0)

const getError = (state: NetworkStatus) =>
  pipe(
    state.query.latestError,
    O.alt(() => state.mutation.latestError)
  )

const eqError: Eq.Eq<O.Option<OperationError>> = O.getEq(Eq.eqStrict)

export const useError = () =>
  useNetworkStatusSubscription(getError, O.none, eqError)

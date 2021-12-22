import React from 'react'
import * as O from 'fp-ts/Option'
import * as RA from 'fp-ts/ReadonlyArray'
import * as RNEA from 'fp-ts/ReadonlyNonEmptyArray'
import { identity, pipe } from 'fp-ts/function'
import { Eq, eqStrict } from 'fp-ts/Eq'
import { Operation } from 'urql'
import { NetworkStatus, useNetworkStatusSubscription } from '../../src'

type Pending = {
  _tag: 'pending'
  operations: RNEA.ReadonlyNonEmptyArray<Operation>
}

type Failure = { _tag: 'failure'; message: string }

type Idle = { _tag: 'idle' }

type OperationsState = Pending | Failure | Idle

const pending = (
  operations: RNEA.ReadonlyNonEmptyArray<Operation>
): OperationsState => ({
  _tag: 'pending',
  operations
})

const failure = (message: string): OperationsState => ({
  _tag: 'failure',
  message
})

const idle = (): OperationsState => ({
  _tag: 'idle'
})

const eqOperationsState: Eq<OperationsState> = {
  equals: (a, b) => {
    if (a._tag !== b._tag) {
      return false
    }

    if (a._tag === 'pending' && b._tag === 'pending') {
      return RA.getEq(eqStrict).equals(a.operations, b.operations)
    }

    return true
  }
}

const pendingOperations = (status: NetworkStatus) =>
  pipe(
    status.mutation.pending,
    RA.concat(status.query.pending),
    RNEA.fromReadonlyArray
  )

const getError = (status: NetworkStatus) =>
  pipe(
    status.mutation.latestError,
    O.alt(() => status.query.latestError)
  )

const useOperationsStatus = () =>
  useNetworkStatusSubscription<OperationsState>(
    (state) => {
      console.log('state', state)
      return pipe(
        pendingOperations(state),
        O.map(pending),
        O.altW(() =>
          pipe(
            state,
            getError,
            O.map((error) => failure(error.error.message))
          )
        ),
        O.fold(idle, identity)
      )
    },
    { _tag: 'idle' },
    eqOperationsState
  )

export const NetworkStatusReporter = () => {
  const status = useOperationsStatus()
  const renderStatus = () => {
    switch (status._tag) {
      case 'pending': {
        return (
          <div>
            <span>pending operations:</span>
            {pipe(
              status.operations,
              RNEA.map((operation) => (
                <div key={operation.key}>
                  {operation.kind}: {operation.key}
                </div>
              ))
            )}
          </div>
        )
      }

      case 'idle': {
        return 'Idle'
      }

      case 'failure': {
        return `Failure: ${status.message}`
      }
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        padding: '0 15px'
      }}
    >
      {renderStatus()}
    </div>
  )
}

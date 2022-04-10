import React from 'react'
import * as RNEA from 'fp-ts/ReadonlyNonEmptyArray'
import { pipe } from 'fp-ts/function'
import { useOperationsStateSubscription } from '../../src'
import * as OperationStatus from '../../src/OperationStatus'

const useOperationsStatus = () =>
  useOperationsStateSubscription(
    (state) => OperationStatus.Monoid.concat(state.query, state.mutation),
    OperationStatus.empty,
    OperationStatus.Eq
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
        return `Failure: ${status.errors[0].error.message}`
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

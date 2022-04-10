import { Operation } from 'urql'
import { OperationTypeNode } from 'graphql'
import { pipe, constant, flow } from 'fp-ts/function'
import * as O from 'fp-ts/Option'
import * as b from 'fp-ts/boolean'
import * as RA from 'fp-ts/ReadonlyArray'
import * as RNEA from 'fp-ts/ReadonlyNonEmptyArray'
import * as OperationStatus from './OperationStatus'
import * as OperationEvent from './OperationEvent'
import { Program, program } from './program'
import { operationError } from './OperationError'

// -------------------------------------------------------------------------------------
// model
// -------------------------------------------------------------------------------------

export interface OperationsState {
  query: OperationStatus.OperationsStatus
  mutation: OperationStatus.OperationsStatus
}

export const emptyOperationsState: OperationsState = {
  query: OperationStatus.empty,
  mutation: OperationStatus.empty
}

// -------------------------------------------------------------------------------------
// reducer
// -------------------------------------------------------------------------------------

const withoutOperation =
  (a: Operation) => (operations: ReadonlyArray<Operation>) =>
    pipe(
      operations,
      RA.filter((b) => a.key !== b.key)
    )

const updateStatus = (
  state: OperationStatus.OperationsStatus,
  action: OperationEvent.OperationEvent
): OperationStatus.OperationsStatus =>
  pipe(
    action,
    OperationEvent.match({
      Request: ({ payload }) =>
        OperationStatus.Monoid.concat(
          state,
          OperationStatus.pending([payload.operation])
        ),
      Success: ({ payload }) =>
        pipe(
          state,
          OperationStatus.match(
            constant(OperationStatus.idle),
            OperationStatus.failure,
            flow(
              withoutOperation(payload.operation),
              RNEA.fromReadonlyArray,
              O.fold(constant(OperationStatus.idle), OperationStatus.pending)
            )
          )
        ),
      Error: ({ payload }) =>
        OperationStatus.Monoid.concat(
          state,
          OperationStatus.failure([
            operationError({
              operation: payload.operation,
              error: payload.error
            })
          ])
        )
    })
  )

const operationTypeReducer =
  (type: OperationTypeNode) =>
  (
    state: OperationStatus.OperationsStatus,
    action: OperationEvent.OperationEvent
  ) =>
    pipe(
      action,
      OperationEvent.isOperationType(type),
      b.fold(constant(state), () => updateStatus(state, action))
    )

const queryReducer = operationTypeReducer('query')
const mutationReducer = operationTypeReducer('mutation')

export const update = (
  state: OperationsState = emptyOperationsState,
  action: OperationEvent.OperationEvent
): OperationsState => ({
  query: queryReducer(state.query, action),
  mutation: mutationReducer(state.mutation, action)
})

// -------------------------------------------------------------------------------------
// program
// -------------------------------------------------------------------------------------

export type OperationsStateProgram = Program<
  OperationEvent.OperationEvent,
  OperationsState
>

export const operationsStateProgram = (): OperationsStateProgram =>
  program<OperationsState, OperationEvent.OperationEvent>(
    emptyOperationsState,
    update
  )

// -------------------------------------------------------------------------------------
// utils
// -------------------------------------------------------------------------------------

export const isOperationType =
  (type: OperationTypeNode) => (operation: Operation) =>
    operation.kind === type

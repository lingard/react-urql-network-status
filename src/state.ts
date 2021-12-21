import { Operation, CombinedError, OperationResult } from 'urql'
import { OperationTypeNode } from 'graphql'
import { Program, program } from './program'
import * as RA from 'fp-ts/ReadonlyArray'
import { pipe, constant } from 'fp-ts/function'
import * as O from 'fp-ts/Option'
import * as b from 'fp-ts/boolean'

// -------------------------------------------------------------------------------------
// actions
// -------------------------------------------------------------------------------------

export interface NetworkStatusActionRequest {
  type: 'Request'
  payload: {
    operation: Operation
  }
}

export interface NetworkStatusActionError {
  type: 'Error'
  payload: {
    operation: Operation
    error: CombinedError
  }
}

export interface NetworkStatusActionSuccess {
  type: 'Success'
  payload: {
    operation: Operation
    result: OperationResult
  }
}

export type NetworkStatusAction =
  | NetworkStatusActionRequest
  | NetworkStatusActionError
  | NetworkStatusActionSuccess

export const networkStatusActionRequest = (
  operation: Operation
): NetworkStatusActionRequest => ({
  type: 'Request',
  payload: {
    operation
  }
})

export const networkStatusActionError = (
  operation: Operation,
  error: CombinedError
): NetworkStatusActionError => ({
  type: 'Error',
  payload: {
    operation,
    error
  }
})

export const networkStatusActionSuccess = (
  operation: Operation,
  result: OperationResult
): NetworkStatusActionSuccess => ({
  type: 'Success',
  payload: {
    operation,
    result
  }
})

export const matchNetworkStatusAction =
  <A>(patterns: {
    [K in NetworkStatusAction['type']]: (
      t: Extract<NetworkStatusAction, { type: K }>
    ) => A
  }) =>
  (
    f: Pick<NetworkStatusAction, 'type'> &
      Partial<Omit<NetworkStatusAction, 'type'>>
  ) =>
    patterns[f.type](f as any)

// -------------------------------------------------------------------------------------
// model
// -------------------------------------------------------------------------------------

export interface OperationError {
  operation: Operation
  error: CombinedError
}

export const operationError = (error: OperationError): OperationError => error

export interface OperationStatus {
  pending: ReadonlyArray<Operation>
  latestError: O.Option<OperationError>
}

export interface NetworkStatus {
  query: OperationStatus
  mutation: OperationStatus
}

const emptyOperationState: OperationStatus = {
  pending: [],
  latestError: O.none
}

export const emptyNetworkStatus: NetworkStatus = {
  query: emptyOperationState,
  mutation: emptyOperationState
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

export const pendingOperations = (
  state: ReadonlyArray<Operation> = [],
  action: NetworkStatusAction
): ReadonlyArray<Operation> =>
  pipe(
    action,
    matchNetworkStatusAction({
      Request: ({ payload }) => pipe(state, RA.append(payload.operation)),
      Success: ({ payload }) =>
        pipe(state, withoutOperation(payload.result.operation)),
      Error: ({ payload }) => pipe(state, withoutOperation(payload.operation))
    })
  )

export const latestOperationError = (
  state: O.Option<OperationError>,
  action: NetworkStatusAction
): O.Option<OperationError> =>
  pipe(
    action,
    matchNetworkStatusAction<O.Option<OperationError>>({
      Request: () => O.none,
      Error: ({ payload }) => O.some(payload),
      Success: (action) => {
        const { result } = action.payload

        if (result.error) {
          const { error, operation } = result

          return O.some({
            error,
            operation
          })
        }

        return state
      }
    })
  )

const operationTypeReducer =
  (type: OperationTypeNode) =>
  (state: OperationStatus, action: NetworkStatusAction) =>
    pipe(
      action,
      isOperationActionType(type),
      b.fold(constant(state), () => ({
        pending: pendingOperations(state.pending, action),
        latestError: latestOperationError(state.latestError, action)
      }))
    )

const queryReducer = operationTypeReducer('query')
const mutationReducer = operationTypeReducer('mutation')

export const update = (
  state: NetworkStatus = emptyNetworkStatus,
  action: NetworkStatusAction
): NetworkStatus => ({
  query: queryReducer(state.query, action),
  mutation: mutationReducer(state.mutation, action)
})

// -------------------------------------------------------------------------------------
// program
// -------------------------------------------------------------------------------------

export type NetworkStatusProgram = Program<NetworkStatusAction, NetworkStatus>

export const networkStatusProgram = () =>
  program<NetworkStatus, NetworkStatusAction>(emptyNetworkStatus, update)

// -------------------------------------------------------------------------------------
// utils
// -------------------------------------------------------------------------------------

export const isOperationType =
  (type: OperationTypeNode) => (operation: Operation) =>
    operation.query.definitions.some(
      (definition) =>
        definition.kind === 'OperationDefinition' &&
        definition.operation === type
    )

export const isOperationActionType =
  (type: OperationTypeNode) => (action: NetworkStatusAction) =>
    pipe(action.payload.operation, isOperationType(type))

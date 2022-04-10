import { OperationTypeNode } from 'graphql'
import { Operation, CombinedError, OperationResult } from 'urql'

// -------------------------------------------------------------------------------------
// model
// -------------------------------------------------------------------------------------

export interface OperationRequestEvent {
  _tag: 'Request'
  payload: {
    operation: Operation
  }
}

export interface OperationErrorEvent {
  _tag: 'Error'
  payload: {
    operation: Operation
    error: CombinedError
  }
}

export interface OperationSuccessEvent {
  _tag: 'Success'
  payload: {
    operation: Operation
    result: OperationResult
  }
}

export type OperationEvent =
  | OperationRequestEvent
  | OperationErrorEvent
  | OperationSuccessEvent

// -------------------------------------------------------------------------------------
// constructors
// -------------------------------------------------------------------------------------

export const operationRequestEvent = (
  operation: Operation
): OperationRequestEvent => ({
  _tag: 'Request',
  payload: {
    operation
  }
})

export const operationErrorEvent = (
  operation: Operation,
  error: CombinedError
): OperationErrorEvent => ({
  _tag: 'Error',
  payload: {
    operation,
    error
  }
})

export const operationSuccessEvent = (
  operation: Operation,
  result: OperationResult
): OperationSuccessEvent => ({
  _tag: 'Success',
  payload: {
    operation,
    result
  }
})

// -------------------------------------------------------------------------------------
// utils
// -------------------------------------------------------------------------------------

export const isOperationType =
  (type: OperationTypeNode) =>
  ({ payload }: OperationEvent) =>
    payload.operation.kind === type

export const match =
  <A>(patterns: {
    [K in OperationEvent['_tag']]: (
      t: Extract<OperationEvent, { _tag: K }>
    ) => A
  }) =>
  (f: OperationEvent) =>
    patterns[f._tag](f as any)

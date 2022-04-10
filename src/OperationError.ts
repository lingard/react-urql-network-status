import { CombinedError, Operation } from 'urql'

export interface OperationError {
  operation: Operation
  error: CombinedError
}

export const operationError = (error: OperationError): OperationError => error

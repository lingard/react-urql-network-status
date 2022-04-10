import * as O from 'fp-ts/Option'
import * as RNEA from 'fp-ts/ReadonlyNonEmptyArray'
import { Operation } from 'urql'
import { PendingOperations } from './OperationQueue'

interface OperationErrors {

}

export interface OperationStatus {
  pendingOperations: PendingOperations
  // latestError:
}


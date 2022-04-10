import * as RA from 'fp-ts/ReadonlyArray'
import * as RNEA from 'fp-ts/ReadonlyNonEmptyArray'
import * as M from 'fp-ts/Monoid'
import { constant, flow, pipe } from 'fp-ts/function'
import * as Equals from 'fp-ts/Eq'
import * as number from 'fp-ts/number'
import * as Operation from './Operation'
import { OperationError } from './OperationError'

export type Idle = { _tag: 'idle' }

export type Pending = {
  _tag: 'pending'
  operations: RNEA.ReadonlyNonEmptyArray<Operation>
}

export type Failure = {
  _tag: 'failure'
  errors: RNEA.ReadonlyNonEmptyArray<OperationError>
}

export type OperationsStatus = Pending | Failure | Idle

export const pending = (
  operations: RNEA.ReadonlyNonEmptyArray<Operation>
): OperationsStatus => ({
  _tag: 'pending',
  operations
})

export const failure = (
  errors: RNEA.ReadonlyNonEmptyArray<OperationError>
): OperationsStatus => ({
  _tag: 'failure',
  errors
})

export const idle: OperationsStatus = {
  _tag: 'idle'
}

export const match =
  <A>(
    onIdle: () => A,
    onFailure: (errors: RNEA.ReadonlyNonEmptyArray<OperationError>) => A,
    onPending: (operations: RNEA.ReadonlyNonEmptyArray<Operation>) => A
  ) =>
  (status: OperationsStatus): A => {
    switch (status._tag) {
      case 'idle': {
        return onIdle()
      }

      case 'failure': {
        return onFailure(status.errors)
      }

      case 'pending': {
        return onPending(status.operations)
      }
    }
  }

export const empty = idle

export const Eq: Equals.Eq<OperationsStatus> = {
  equals: (a, b) => {
    if (a._tag !== b._tag) {
      return false
    }

    if (a._tag === 'pending' && b._tag === 'pending') {
      return RA.getEq(Equals.eqStrict).equals(a.operations, b.operations)
    }

    return true
  }
}

const concatOperations =
  (as: RNEA.ReadonlyNonEmptyArray<Operation>) =>
  (bs: RNEA.ReadonlyNonEmptyArray<Operation>) =>
    pipe(bs, RNEA.concat(as), RA.uniq(eqOperation))

export const Monoid: M.Monoid<OperationsStatus> = {
  empty,
  concat: (a, b) => {
    const constA = constant(a)
    const constB = constant(b)

    return pipe(
      a,
      match(
        () => b,
        (as) => pipe(b, match(constA, flow(RNEA.concat(as), failure), constB)),
        (as) =>
          pipe(b, match(constA, constB, flow(concatOperations(as), pending)))
      )
    )
  }
}

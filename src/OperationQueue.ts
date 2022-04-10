import * as O from 'fp-ts/Option'
import * as Equals from 'fp-ts/Eq'
import * as S from 'fp-ts/Set'
import * as Operation from './Operation'

export type OperationQueue = O.Option<Set<Operation.Operation>>

export const Eq: Equals.Eq<OperationQueue> = O.getEq(S.getEq(Operation.Eq))

export const Semigroup = O.getMonoid(
  S.getUnionSemigroup<Operation.Operation>(Operation.Eq)
)

// export const fromEvent = () =>

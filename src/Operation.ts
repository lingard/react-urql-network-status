import { contramap } from 'fp-ts/Eq'
import { Operation } from 'urql'
import * as number from 'fp-ts/number'

export { Operation }

export const Eq = contramap((operation: Operation) => operation.key)(number.Eq)
